var mongoose = require('mongoose');
var fs = require('fs');
var db = mongoose.createConnection('127.0.0.1', 'docmc');
var DocSchema = require('../models/doc.js').DocSchema;
var SeqSchema = require('../models/seq.js').SequenceSchema;
var BrowerSchema = require('../models/brower.js').BrowerSchema;
var Seq = db.model('sequence', SeqSchema);
var Doc = db.model('doc', DocSchema);
var Brower = db.model('brower', BrowerSchema);
var UserSchema = require('../models/user.js').UserSchema;
var User = db.model('user', UserSchema);
var DictSchema = require('../models/dict.js').DictSchema;
var Dict = db.model('dict', DictSchema);

DocSchema.pre('save', function(next) {
    var doc = this;
    Seq.findOneAndUpdate( {"seq_name":'doc_id'}, { $inc: { seq: 1 } }, function (err, settings) {
        if (err) next(err);
        console.log(settings);
        doc.doc_id = settings.seq - 1;
        console.log(doc.doc_id);
        next();
    });
});

console.log("index route is init");

//删除档案信息
exports.deleteDoc = function(req, res) {
    console.log('deleteDoc started');
    Doc.findOneAndRemove({doc_id:req.body.doc_id}, function(err, doc) {
        Brower.remove({doc_id:req.body.doc_id}, function(err, brower){
            if (err) {
                throw err;
            } else {
                res.json(doc);
            }
        });
    });
};

//更新档案信息
exports.updateDoc = function(req, res) {
    console.log('updateDoc started');
    var reqBody = req.body, docObj = {
            doc_id : reqBody.doc_id,
            doc_name : reqBody.doc_name,
            doc_type : reqBody.doc_type,
            doc_img : reqBody.doc_img,
            doc_file : reqBody.doc_file,
            doc_tag : reqBody.doc_tag,
            project_name : reqBody.project_name,
            total_num : reqBody.total_num,
            doc_location : reqBody.doc_location,
            doc_mgr : reqBody.doc_mgr
    };
    console.log('doc_id='+reqBody.doc_id);
    
    Doc.findOne( {"doc_id":reqBody.doc_id}, function (err, docInfo) {
        if (err) throw err;
        
        var inc = docObj.total_num - docInfo.total_num;
        console.log('docInfo.store_num='+docInfo.store_num);
        docObj.store_num = docInfo.store_num;
        docObj.store_num += inc;
        
        Doc.findOneAndUpdate({doc_id:req.body.doc_id}, {$set:docObj}, function(err, doc) {
            if (err || !doc) {
                console.log(err);
                throw err;
            } else {
                res.json(doc);
            }
        });
    });
    
};

//保存档案信息
exports.saveDoc = function(req, res) {
    console.log('saveDoc started');
    var now = new Date();
    var reqBody = req.body, docObj = {
            doc_name : reqBody.doc_name,
            doc_type : reqBody.doc_type,
            doc_img : reqBody.doc_img,
            doc_file : reqBody.doc_file,
            doc_tag : reqBody.doc_tag,
            project_name : reqBody.project_name,
            total_num : reqBody.total_num,
            store_num : reqBody.total_num,
            create_time : now.getFullYear()+'-'+(now.getMonth()+1)+'-'+now.getDate()+' '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds(),
            doc_location : reqBody.doc_location,
            doc_mgr : reqBody.doc_mgr
    };
    var doc = new Doc(docObj);
    doc.save(function(err, doc) {
        if (err || !doc) {
            throw err;
        } else {
            res.json(doc);
        }
    });
};

//借阅档案
exports.browerDoc = function(req, res) {
    console.log('browerDoc started');
    Doc.count({"doc_id": req.body.doc_id, "store_num":{"$gt":0}}).exec(function (err, count) {
        if (count < 0) {
            res.json({
                msg: '档案没有可用库存，无法借阅！'
            });
            return;
        }
        Doc.findOneAndUpdate({"doc_id": req.body.doc_id, "store_num":{"$gt":0}}, { $inc: { store_num: -1 }}, function(err, doc){
            if (doc.store_num < 0)
                return res.json({
                    msg: '档案没有可用库存，无法借阅！'
                });
            var now = new Date();
            var reqBody = req.body, browerObj = {
                    doc_id : reqBody.doc_id,
                    brower_men : reqBody.brower_men,
                    brower_time : now.getFullYear()+'-'+(now.getMonth()+1)+'-'+now.getDate()+' '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds(),
                    brower_mark: '借阅'
            };
            var brower = new Brower(browerObj);
            brower.save(function(err, brower) {
                if (err || !brower) {
                    throw err;
                } else {
                    res.json(brower);
                }
            });
        });
    });
};

//归还档案
exports.backDoc = function(req, res) {
    console.log('backDoc started');
    Doc.count({"doc_id": req.body.doc_id, $where: "this.store_num < this.total_num" }, function(err, count){
        console.log('doc_count='+count);
        if (count == 0) {
            res.json({
                msg: '档案未被'+req.body.brower_men+'借阅，无法归还！'
            });
            return;
        }
        Brower.count({"doc_id": req.body.doc_id, "brower_mark":"借阅","brower_men": req.body.brower_men, "is_back": false}, function(err, count){
            console.log('brower_count='+count);
            if (count == 0) {
                res.json({
                    msg: '档案未被'+req.body.brower_men+'借阅，无法归还！'
                });
                return;
            }
            Brower.findOneAndUpdate({"doc_id": req.body.doc_id, "brower_men": req.body.brower_men, "is_back": false}, {$set:{is_back:true}}, function(err, browerInfo){
                Doc.findOneAndUpdate({"doc_id": req.body.doc_id, $where: "this.store_num < this.total_num" }, { $inc: { store_num: 1 }}, function(err, docInfo){
                    var now = new Date();
                    var reqBody = req.body, browerObj = {
                            doc_id : reqBody.doc_id,
                            brower_men : reqBody.brower_men,
                            brower_time : now.getFullYear()+'-'+(now.getMonth()+1)+'-'+now.getDate()+' '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds(),
                            brower_mark: '归还'
                    };
                    var brower = new Brower(browerObj);
                    brower.save(function(err, brower) {
                        if (err) {
                            throw err;
                        } else {
                            res.json(brower);
                        }
                    });
                });
              });
        });
    });
};

//查询借阅归还信息
exports.getbrowreAll = function(req, res) {
    console.log('getbrowreAll started');
    //获取查询参数
    var doc_id = req.body.doc_id;
    var doc_name = req.body.doc_name;
    var project_name = req.body.project_name;
    var doc_type = req.body.doc_type;
    var doc_mgr = req.body.doc_mgr;
    var doc_location = req.body.doc_location;
    var doc_tag = req.body.doc_tag;
    var brower_men = req.body.brower_men;
    var brower_mark = req.body.brower_mark;
    
    var paramsstr = "{";
    if (doc_id !== undefined  && doc_id !== "") {
        paramsstr += '"doc_id":'+doc_id+',';
    }
    if (doc_name !== undefined && doc_name !== "") {
        paramsstr += '"doc_name":/'+doc_name+'/,';
    }
    if (project_name !== undefined && project_name !== "") {
        paramsstr += '"project_name":/'+project_name+'/,';
    }
    if (doc_type !== undefined && doc_type !== "") {
        paramsstr += '"doc_type":"'+doc_type+'",';
    }
    if (doc_mgr !== undefined && doc_mgr !== "") {
        paramsstr += '"doc_mgr":"'+doc_mgr+'",';
    }
    if (doc_location !== undefined && doc_location !== "") {
        paramsstr += '"doc_location":"'+doc_location+'",';
    }
    if (doc_tag !== undefined && doc_tag !== "") {
        paramsstr += '"doc_tag":"'+doc_tag+'",';
    }
    if (paramsstr.indexOf(",") != -1)
        paramsstr = paramsstr.substring(0, paramsstr.length-1);
    paramsstr += '}';
    
    console.log('doc_filter='+paramsstr);
    
    var paramsBrowerStr = "{";
    if (brower_men !== undefined  && brower_men !== "") {
        paramsBrowerStr += '"brower_men":"'+brower_men+'",';
    }
    if (brower_mark !== undefined && brower_mark !== "") {
        paramsBrowerStr += '"brower_mark":"'+brower_mark+'",';
    }
    if (paramsBrowerStr.indexOf(",") != -1)
        paramsBrowerStr = paramsBrowerStr.substring(0, paramsBrowerStr.length-1);
    paramsBrowerStr += '}';
    
    console.log('brower_filter='+paramsBrowerStr);
    var paramsBrower = eval("("+paramsBrowerStr+")");
    
    var browerWrapInfos = [];
    //没有对文档进行条件限制，直接查询借阅归还记录
    if (paramsstr.indexOf(':') == -1) {
        Brower.find(paramsBrower).skip(req.body.start).limit(req.body.length).exec(function(error, browerInfos) {
            Brower.count(paramsBrower).exec(function(error, count) {
                //查询档案信息
                var doc_id_arr = [];
                for (var i in browerInfos) {
                    doc_id_arr.push(browerInfos[i].doc_id);
                }
                
                Doc.find({}).where('doc_id').in(doc_id_arr).exec(function(err, docInfos){
                    console.log('doc_id_arr='+doc_id_arr);
                    for (var i in browerInfos) {
                        var browerInfo = browerInfos[i];
                        for (var j in docInfos) {
                            var docInfo = docInfos[j];
                            if (browerInfo.doc_id == docInfo.doc_id) {
                                browerWrapInfos[i] = {
                                    _id : browerInfo._id,
                                    doc_id: browerInfo.doc_id,
                                    doc_name: docInfo.doc_name,
                                    doc_location: docInfo.doc_location,
                                    brower_men: browerInfo.brower_men,
                                    brower_mark: browerInfo.brower_mark,
                                    store_num: docInfo.store_num,
                                    total_num: docInfo.total_num,
                                    brower_time: browerInfo.brower_time,
                                    is_back: browerInfo.is_back
                                };
                                break;
                            }
                        }
                    }
                    //返回结果
                    res.json({
                        draw: req.body.draw,
                        recordsTotal: count,
                        recordsFiltered: count,
                        data: browerWrapInfos, 
                    });
                });
            });
        });
    } else {
        console.log("paramsstr=" + paramsstr);
        var params = eval("("+paramsstr+")");
        Doc.find(params).exec(function(error, docInfos) {
            //查询出档案id，组装档案id条件
            var doc_id_arr = [];
            for (var i in docInfos) {
                doc_id_arr.push(docInfos[i].doc_id);
            }
            
            console.log('doc_id_arr='+doc_id_arr);
            Brower.find(paramsBrower).where('doc_id').in(doc_id_arr).skip(req.body.start).limit(req.body.length).populate('doc_id').exec(function(err, browerInfos){
                Brower.count(paramsBrower).where('doc_id').in(doc_id_arr).exec(function(error, count) {
                    //遍历借阅信息，将档案信息加入
                    if (count == 0) {
                        res.json({
                            msg: '没有查到相关借阅归还信息！'
                        });
                        return; 
                    }
                    for (var i in browerInfos) {
                        var browerInfo = browerInfos[i];
                        for (var j in docInfos) {
                            var docInfo = docInfos[j];
                            if (browerInfo.doc_id == docInfo.doc_id) {
                                browerWrapInfos[i] = {
                                        _id : browerInfo._id,
                                        doc_id: browerInfo.doc_id,
                                        doc_name: docInfo.doc_name,
                                        doc_location: docInfo.doc_location,
                                        brower_men: browerInfo.brower_men,
                                        brower_mark: browerInfo.brower_mark,
                                        store_num: docInfo.store_num,
                                        total_num: docInfo.total_num,
                                        brower_time: browerInfo.brower_time,
                                        is_back: browerInfo.is_back
                                };
                            }
                        }
                    }
                    //返回结果
                    res.json({
                        draw: req.body.draw,
                        recordsTotal: count,
                        recordsFiltered: count,
                        data: browerWrapInfos, 
                    });
                });
            });
            
        });
    }
    
};

//查询档案信息
exports.getDocAll = function(req, res) {
    console.log('getDocAll started');
    //获取查询参数
    var doc_id = req.body.doc_id;
    var doc_name = req.body.doc_name;
    var project_name = req.body.project_name;
    var doc_type = req.body.doc_type;
    var doc_mgr = req.body.doc_mgr;
    var doc_location = req.body.doc_location;
    var doc_tag = req.body.doc_tag;
    
    var paramsstr = "{";
    if (doc_id !== undefined  && doc_id !== "") {
        paramsstr += '"doc_id":'+doc_id+',';
    }
    if (doc_name !== undefined && doc_name !== "") {
        paramsstr += '"doc_name":/'+doc_name+'/,';
    }
    if (project_name !== undefined && project_name !== "") {
        paramsstr += '"project_name":/'+project_name+'/,';
    }
    if (doc_type !== undefined && doc_type !== "") {
        paramsstr += '"doc_type":"'+doc_type+'",';
    }
    if (doc_mgr !== undefined && doc_mgr !== "") {
        paramsstr += '"doc_mgr":"'+doc_mgr+'",';
    }
    if (doc_location !== undefined && doc_location !== "") {
        paramsstr += '"doc_location":"'+doc_location+'",';
    }
    if (doc_tag !== undefined && doc_tag !== "") {
        paramsstr += '"doc_tag":"'+doc_tag+'",';
    }
    if (paramsstr.indexOf(",") != -1)
        paramsstr = paramsstr.substring(0, paramsstr.length-1);
    paramsstr += '}';
    console.log("paramsstr=" + paramsstr);
    var params = eval("("+paramsstr+")");
    Doc.find(params).skip(req.body.start).limit(req.body.length).exec(function(error, docInfos) {
        Doc.count(params).exec(function (err, count) {
            res.json({
                draw: req.body.draw,
                recordsTotal: count,
                recordsFiltered: count,
                data: docInfos, 
            })
          });
    });
};

exports.saveImageFile = function(req,res){
    console.log('FIRST TEST: ' + JSON.stringify(req.files));
    console.log('filePath=' + req.files.file.path);
    var file_path = req.files.file.path;
    var img_name = "";
    if (file_path.indexOf('/') != -1) {
        var index = file_path.lastIndexOf('/') + 1;
        img_name = file_path.substr(index);
    }
    if (file_path.indexOf('\\') != -1) {
        var index = file_path.lastIndexOf('\\') + 1;
        img_name = file_path.substr(index);
    }
    img_name += req.files.file.name.substr(req.files.file.name.lastIndexOf('.'));
    var newPath = __dirname + "/../public/upload/img/" + img_name;
    console.log('newPath=' + newPath);
    
    var writesream = fs.createWriteStream(newPath);
    var readstream = fs.createReadStream(req.files.file.path);
    
    readstream.pipe(writesream);
    readstream.on('end', function() {
        writesream.close();
        res.json({
            msg: '成功上传！',
            url: '../upload/img/' + img_name
        });
    });
    
};

exports.saveDocFile = function(req,res){
    console.log('FIRST TEST: ' + JSON.stringify(req.files));
    console.log('filePath=' + req.files.file.path);
    var file_path = req.files.file.path;
    var img_name = "";
    if (file_path.indexOf('/') != -1) {
        var index = file_path.lastIndexOf('/') + 1;
        img_name = file_path.substr(index);
    }
    if (file_path.indexOf('\\') != -1) {
        var index = file_path.lastIndexOf('\\') + 1;
        img_name = file_path.substr(index);
    }
    img_name += req.files.file.name.substr(req.files.file.name.lastIndexOf('.'));
    var newPath = __dirname + "/../public/upload/doc/" + img_name;
    console.log('newPath=' + newPath);
    
    var writesream = fs.createWriteStream(newPath);
    var readstream = fs.createReadStream(req.files.file.path);
    
    readstream.pipe(writesream);
    readstream.on('end', function() {
        res.json({
            msg: '成功上传！',
            url: '../upload/doc/' + img_name
        });
    });
 };
 
UserSchema.pre('save', function(next) {
    var user = this;
    Seq.findOneAndUpdate( {"seq_name":'user_id'}, { $inc: { seq: 1 } }, function (err, settings) {
      if (err) next(err);
      console.log(settings);
      user.user_id = settings.seq - 1;
      console.log(user.user_id);
      next();
    });
 });

console.log("index route is init");

//保存档案信息

exports.saveDoc = function(req, res) {
    console.log('saveDoc started');
    var now = new Date();
    var reqBody = req.body, docObj = {
        doc_name : reqBody.doc_name,
        doc_type : reqBody.doc_type,
        doc_tag : reqBody.doc_tag,
        doc_img : reqBody.doc_img,
        doc_file : reqBody.doc_file,
        project_name : reqBody.project_name,
        total_num : reqBody.total_num,
        store_num : reqBody.total_num,
        create_time : now.getFullYear()+'-'+(now.getMonth()+1)+'-'+now.getDate()+' '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds(),
        doc_location : reqBody.doc_location,
        doc_mgr : reqBody.doc_mgr
    };
    var doc = new Doc(docObj);
    doc.save(function(err, doc) {
        if (err || !doc) {
            throw err;
        } else {
            res.json(doc);
        }
    });
};



//保存用户信息

exports.saveUser = function(req, res) {
  console.log('saveUser started');
  var now = new Date().getTime();
  var reqBody = req.body, userObj = {
		  user_name : reqBody.user_name,
		  user_role : reqBody.user_role,
      isvalid : reqBody.isvalid,
      create_user : reqBody.create_user 
  };
  var user = new User(userObj);
  console.log(user);
  user.save(function(err, user) {
      if (err || !user) {
          throw err;
      } else {
          res.json(user);
      }
  });
};
exports.deleteUser = function(req, res) {
	  console.log('deleteUser started');
	  var reqBody = req.body, userObj = {
			  user_id : reqBody.user_id
	  };
	  var user = new User(userObj);
	  console.log(user);
	  var data ;
	  User.remove( {user_id:user.user_id},function(err, user) {
	      if (err || !user) {
	          throw err;
	      } else {
	    	  data = "true";
	          res.json(data);
	      }
	  });
	};
exports.updateUser = function(req, res) {
  console.log('updateUser started');
  var now = new Date().getTime();
  var reqBody = req.body, userObj = {
		  user_name : reqBody.user_name,
		  user_role : reqBody.user_role,
      isvalid : reqBody.isvalid,
      create_user : reqBody.create_user
  };
  var user = new User(userObj);
  console.log(user);
  User.findOneAndUpdate( {"user_id":reqBody.user_id}, { $set: { user_name: user.user_name,user_role:user.user_role,isvalid:user.isvalid } }, function (err, settings) {
	  var data = "true";
      res.json(data);
    });
};
//查询对应修改记录，并跳转到修改页面
exports.toUserModify = function(req, res) {
	var id = req.params.user_id;
	console.log('id = ' + id);
	
	if(id && '' != id) {
		console.log('----delete id = ' + id);
		User.findById({user_id:id}, function(err, users){
			console.log('-------findById()------' + users);
			
			res.render('/ajax/userupdate.html',{title:'修改ToDos',user:users});
		});
	};
};
exports.getUserByID = function(req, res) {
	  console.log('getUserByID started');
	  //获取查询参数
	  var user_id = req.body.user_id;
	  
	  var paramsstr = "{";
	  if (user_id !== undefined && user_id !== "") {
	      paramsstr += '"user_id":"'+user_id+'",';
	  }
	  if (paramsstr.indexOf(",") > -1){
	  	paramsstr = paramsstr.substring(0, paramsstr.length-1);
	  }
	  paramsstr += '}';
	  console.log("paramsstr=" + paramsstr);
	  var params = eval("("+paramsstr+")");
	  //调用mongodb查询用户信息
	  User.findOne(params,  
		  function(error,user){
		  console.log(user);
			  res.json({
	              data: user, 
	          })
	  } );
}

//查询用户
exports.getUserInfo = function(req, res) {
  console.log('getUserInfo started');
  //获取查询参数
  var user_name = req.body.user_name;
  var isvalid = req.body.isvalid;
  var user_role = req.body.user_role;
  var user_class = req.body.user_class;
  var user_id = req.body.user_id;
  var create_user = req.body.create_user;
  
  var paramsstr = "{";
  if (user_name !== undefined && user_name !== "") {
      paramsstr += '"user_name":/'+user_name+'/,';
  }
  if (isvalid !== undefined && isvalid !== "") {
      paramsstr += '"isvalid":"'+isvalid+'",';
  }
  if (user_role !== undefined && user_role !== "") {
      paramsstr += '"user_role":"'+user_role+'",';
  }
  if (user_class !== undefined && user_class !== "") {
      paramsstr += '"user_class":"'+user_class+'",';
  }
  if (user_id !== undefined && user_id !== "") {
      paramsstr += '"user_id":"'+user_id+'",';
  }
  if (create_user !== undefined && create_user !== "") {
      paramsstr += '"create_user":"'+create_user+'",';
  }
  if (paramsstr.indexOf(",") > -1){
  	paramsstr = paramsstr.substring(0, paramsstr.length-1);
  }
  paramsstr += '}';
  console.log("paramsstr=" + paramsstr);
  var params = eval("("+paramsstr+")");
  //调用mongodb查询用户信息
  User.find(params, {_id:1,user_name:1,ranking:1,isvalid:1,user_role:1,user_class:1, user_id:1, create_user:1}).limit(req.body.length).exec(function(error, users) {
	  User.count(params).exec(function (err, count) {
          res.json({
              draw: req.body.draw,
              recordsTotal: count,
              recordsFiltered: count,
              data: users, 
          })
        });
  });
};

exports.getDict = function(req, res) {
	  console.log('getDict started');
	  //获取查询参数
	  
	  var paramsstr = "{}";
	  var params = eval("("+paramsstr+")");
	  //调用mongodb查询字典表信息
	  Dict.find(params, {}).limit(req.body.length).exec(function(error, dicts) {
		  Dict.count(params).exec(function (err, count) {
	          res.json({
	              draw: req.body.draw,
	              recordsTotal: count,
	              recordsFiltered: count,
	              data: dicts, 
	          })
	        });
	  });
	};

//保存用户信息
exports.saveDict = function(req, res) {
	  console.log('saveDict started');
	  var reqBody = req.body, dictObj = {
			  dict_type : reqBody.dict_type,
			  dict_value : reqBody.dict_value
	  };
	  var dict = new Dict(dictObj);
	  dict.save(function(err, dict) {
	      if (err || !dict) {
	          throw err;
	      } else {
	          res.json(dict);
	      }
	  });
	};
//删除档案信息
exports.deleteDict = function(req, res) {
    console.log('deleteDict started');
	  var reqBody = req.body, dictObj = {
			  dict_type : reqBody.dict_type,
			  dict_value: reqBody.dict_value
	  };
	  var dict = new Dict(dictObj);
	  console.log(dict);
	  var data ;
	  Dict.remove( {dict_type:dict.dict_type,dict_value:dict.dict_value},function(err, dict) {
	      if (err || !dict) {
	          throw err;
	      } else {
	    	  data = "true";
	          res.json(data);
	      }
	  });
};