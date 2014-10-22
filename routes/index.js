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
var PermSchema = require('../models/perm.js').PermSchema;
var LogSchema = require('../models/log.js').LogSchema;
var User = db.model('user', UserSchema);
var Perm = db.model('perm', PermSchema);
var Log = db.model('log', LogSchema);
var DictSchema = require('../models/dict.js').DictSchema;
var Dict = db.model('dict', DictSchema);
var crypto = require('crypto');


DocSchema.pre('save', function(next) {
    var doc = this;
    Seq.findOneAndUpdate( {"seq_name":'doc_id'}, { $inc: { seq: 1 } }, function (err, settings) {
        if (err) next(err);
        console.log(settings);
        var now1 = new Date();
        var month = (now1.getMonth()+1);
        if (month < 10) {
            month = '0'+month;
        }
        var doc_id = ""+now1.getFullYear()+month+now1.getDate()+'-'+(settings.seq - 1);
        doc.doc_id = doc_id
        console.log(doc);
        next();
    });
});

console.log("index route is init");

// 删除档案信息
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

// 更新档案信息
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
            doc_mgr : reqBody.doc_mgr,
            ele_location : reqBody.ele_location
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

// 保存档案信息
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
            ele_location : req.body.ele_location,
            doc_mgr : reqBody.doc_mgr,
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

// 借阅档案
exports.browerDoc = function(req, res) {
    console.log('browerDoc started');
    Doc.count({"doc_id": req.body.doc_id, "store_num":{"$gte":req.body.brower_num}}).exec(function (err, count) {
        if (count < 0) {
            res.json({
                  msg: '档案没有可用库存，无法借阅！'
            });
            return;
        }
        Doc.findOneAndUpdate({"doc_id": req.body.doc_id, "store_num":{"$gte":req.body.brower_num}}, { $inc: { store_num: - req.body.brower_num }}, function(err, doc){
            if (doc.store_num < 0)
              return res.json({
                  msg: '档案没有可用库存，无法借阅！'
              });
            var now = new Date();
            var brower_arr = [];
            for (var i = 0; i < req.body.brower_num; i++) {
              var reqBody = req.body, browerObj = {
                      doc_id : reqBody.doc_id,
                      brower_men : reqBody.brower_men,
                      brower_time : now.getFullYear()+'-'+(now.getMonth()+1)+'-'+now.getDate()+' '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds(),
                      brower_mark: '借阅',
                      is_back: false
              };
              brower_arr.push(browerObj);
            }
            
            Brower.collection.insert(brower_arr, function(err, brower) {
                  if (err || !brower) {
                      throw err;
                  } else {
                      res.json({data:brower});
                  }
            });
        });
    });
};

// 归还档案
exports.backDoc = function(req, res) {
    console.log('backDoc started');
    Doc.count({"doc_id": req.body.doc_id, $where: "this.store_num - this.total_num < "+req.body.brower_num }, function(err, count){
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
            if (count < req.body.brower_num) {
  res.json({
      msg: '归还数量'+req.body.brower_num+'超过'+req.body.brower_men+'借阅数量'+count+'，无法归还！'
  });
  return;
            }
            
            Doc.findOneAndUpdate({"doc_id": req.body.doc_id, $where: "this.store_num - this.total_num < "+req.body.brower_num }, { $inc: { store_num: req.body.brower_num }}, function(err, docInfo){
  
  Brower.find({"doc_id": req.body.doc_id, "brower_men": req.body.brower_men, "is_back": false}).sort({brower_time:-1}).limit(req.body.brower_num).exec(function(error, browerInfos){
      browerInfos.forEach(function(p) {
          p.set({"is_back":true});
          p.save();
      });
  });
  
  var now = new Date();
  var brower_arr = [];
  for (var i = 0; i < req.body.brower_num; i++) {
      var reqBody = req.body, browerObj = {
doc_id : reqBody.doc_id,
brower_men : reqBody.brower_men,
brower_time : now.getFullYear()+'-'+(now.getMonth()+1)+'-'+now.getDate()+' '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds(),
brower_mark: '归还',
is_back:false
      };
      brower_arr.push(browerObj);
  }
  
  Brower.collection.insert(brower_arr, function(err, brower) {
      if (err || !brower) {
          throw err;
      } else {
          res.json({data:brower});
      }
  });
            });
        });
    });
};

// 查询借阅归还信息
exports.getbrowreAll = function(req, res) {
    console.log('getbrowreAll started');
    // 获取查询参数
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
        paramsstr += '"doc_id":/'+doc_id+'/,';
    }
    if (doc_name !== undefined && doc_name !== "") {
    	doc_name = doc_name.replace(" ", ".*");
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
    // 没有对文档进行条件限制，直接查询借阅归还记录
    if (paramsstr.indexOf(':') == -1) {
        Brower.find(paramsBrower).skip(req.body.start).limit(req.body.length).exec(function(error, browerInfos) {
            Brower.count(paramsBrower).exec(function(error, count) {
  // 查询档案信息
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
        total_num: docInfo.total_num - docInfo.store_num,
        brower_time: browerInfo.brower_time,
        is_back: browerInfo.is_back
    };
    break;
}
          }
      }
      // 返回结果
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
            // 查询出档案id，组装档案id条件
            var doc_id_arr = [];
            for (var i in docInfos) {
  doc_id_arr.push(docInfos[i].doc_id);
            }
            
            console.log('doc_id_arr='+doc_id_arr);
            Brower.find(paramsBrower).where('doc_id').in(doc_id_arr).skip(req.body.start).limit(req.body.length).populate('doc_id').exec(function(err, browerInfos){
  Brower.count(paramsBrower).where('doc_id').in(doc_id_arr).exec(function(error, count) {
      // 遍历借阅信息，将档案信息加入
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
            total_num: docInfo.total_num - docInfo.store_num,
            brower_time: browerInfo.brower_time,
            is_back: browerInfo.is_back
    };
}
          }
      }
      // 返回结果
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

// 查询操作日志信息
exports.getLogAll = function(req, res) {
    console.log('getLogAll started');
    // 获取查询参数
    var user_name = req.body.user_name;
    var oper_type = req.body.oper_type;
    
    var paramsstr = "{";
    if (user_name !== undefined && user_name !== "") {
        paramsstr += '"user_name":"'+user_name+'",';
    }
    if (oper_type !== undefined && oper_type !== "") {
        paramsstr += '"oper_type":"'+oper_type+'",';
    }
    if (paramsstr.indexOf(",") != -1)
        paramsstr = paramsstr.substring(0, paramsstr.length-1);
    paramsstr += '}';
    console.log("paramsstr=" + paramsstr);
    var params = eval("("+paramsstr+")");
    Log.find(params).skip(req.body.start).limit(req.body.length).exec(function(error, logInfos) {
        Log.count(params).exec(function (err, count) {
            res.json({
                draw: req.body.draw,
                recordsTotal: count,
                recordsFiltered: count,
                data: logInfos, 
            })
        });
    });
};
// 查询档案信息
exports.getDocAll = function(req, res) {
    console.log('getDocAll started');
    // 获取查询参数
    var doc_id = req.body.doc_id;
    var doc_name = req.body.doc_name;
    var project_name = req.body.project_name;
    var doc_type = req.body.doc_type;
    var doc_mgr = req.body.doc_mgr;
    var doc_location = req.body.doc_location;
    var doc_tag = req.body.doc_tag;
    
    var paramsstr = "{";
    if (doc_id !== undefined  && doc_id !== "") {
        paramsstr += '"doc_id":/'+doc_id+'/,';
    }
    if (doc_name !== undefined && doc_name !== "") {
    	doc_name = doc_name.replace(" ", ".*");
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

// 保存用户信息
exports.saveUser = function(req, res) {
  console.log('saveUser started');
  var md5 = crypto.createHash('md5');
  md5.update(req.body.password);
  var d = md5.digest('hex');
  var reqBody = req.body, userObj = {
		  user_name : reqBody.user_name,
		  user_role : reqBody.user_role,
      password : d,
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
  var md5 = crypto.createHash('md5');
  md5.update(req.body.password);
  
  var d = md5.digest('hex');
  var reqBody = req.body, userObj = {
      password : d
  };
  var user = new User(userObj);
  User.findOneAndUpdate( {"user_id":reqBody.user_id}, { $set: { password:user.password } }, function (err, data) {
      res.json(data);
    });
};
// 查询对应修改记录，并跳转到修改页面
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
	  // 获取查询参数
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
	  // 调用mongodb查询用户信息
	  User.findOne(params,  
		  function(error,user){
		  console.log(user);
			  res.json({
	data: user, 
	          })
	  } );
}

// 查询用户
exports.getUserInfo = function(req, res) {
    console.log('getUserInfo started');
    // 获取查询参数
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
    // 调用mongodb查询用户信息
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
// 用户登陆
exports.userLogin = function(req, res) {
    console.log('userLogin started');
    // 获取查询参数
    var username = req.body.username;
    var password = req.body.password;
    
    var md5 = crypto.createHash('md5');
    md5.update(password);
    var d = md5.digest('hex');
    console.log('password='+d);
    // 调用mongodb查询用户信息
    User.findOne({user_name:username}, {_id:1,user_name:1,ranking:1,isvalid:1,user_role:1,user_class:1, user_id:1, create_user:1}).exec(function(error, user) {
        req.session.user = user;
        res.json({
            data: req.session.user, 
        })
    });
};
// 用户登出
exports.userLogout = function(req, res) {
  console.log('userLogout started');
  res.json({
      data: req.session.user, 
  });
};

exports.getDict = function(req, res) {
    console.log('getDict started');
    // 获取查询参数
    
    var paramsstr = "{}";
    var params = eval("("+paramsstr+")");
    // 调用mongodb查询字典表信息
    Dict.find(params, {}).skip(req.body.start).limit(req.body.length).exec(function(error, dicts) {
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

exports.getDictOne = function(req, res) {
	  console.log('getDict started');
	  // 调用mongodb查询字典表信息
	  Dict.find({dict_type:req.body.dict_type}).exec(function(error, dicts) {
          res.json({
data: dicts, 
          });
	  });
	};

// 保存用户信息
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
// 删除档案信息
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

exports.requiredAuthentication = function(req, res, next) {
    var url = req.url;
    if (url.indexOf('?') != -1)
        url = url.substr(0, url.indexOf('?'));
    console.log('url============'+url);
    if (url =='/login.html' || url=='/ajax/brower.html'||url=='/ajax/userudpate.html'||url=='/ajax/dictadd.html'||url=='/ajax/error404.html'||url=='/ajax/error505.html'||url=='/ajax/blank_.html') {
        next();
        return;
    }
    if (url.indexOf('.html') != -1) {
            if (req.session.user && req.session.user.user_name) {
                if (url == '/index.html') {
                    next();
                    return;
                }
                    
                // 检查权限
                Perm.findOne({perm_type:req.session.user.user_role}, function(error, perm){
                  var permArr = perm.perm_string.split('&');
                  var isFound = false;
                  for (var perm in permArr) {
                      if (permArr[perm] == url) {
                          isFound = true;
                          break;
                      }
                  }
                  if (isFound) {
                      next();
                      return;
                  } else {
                      console.log('log=============Access denied'+url);
                      res.redirect('/ajax/error404.html');
                  }
            });
        }else {
            console.log('log=============Access denied'+url);
            req.session.error = 'Access denied!';
            res.redirect('/login.html');
        }
    } else {
        console.log('log============='+url);
        
        var oper_name ='';
        var oper_target = '';
        var user_name = '';
        
        // 记录操作日志
        if('/doc/save'== url) {
            // 保存文档
            oper_name = '档案录入';
            oper_target = req.body.doc_name;
        } 
        else if ('/doc/update' == url) {
            oper_name = '档案编辑';
            oper_target = req.body.doc_name;
        }
        else if('/doc/delete'  == url){
            oper_name = '档案删除';
            oper_target = req.body.doc_id;
        }
        else if('/doc/brower'  == url){
            oper_name = '档案借阅';
            oper_target = req.body.doc_id;
        }
        else if('/doc/back'    == url){
            oper_name = '档案归还';
            oper_target = req.body.doc_id;
        }
        else if('/fileupload'  == url){
            oper_name = '上传封面';
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
            oper_target = newPath;
        }
        else if('/fileuploaddoc'  == url){
            oper_name = '上传电子档案';
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
            oper_target = newPath;
        }
        else if('/user/save'   == url){
            oper_name = '用户新增';
            oper_target = req.body.user_name;
        }
        else if('/user/delete' == url){
            oper_name = '用户删除';
            oper_target = req.body.user_id;
        }
        else if('/user/login'  == url){
            oper_name = '用户登录';
            oper_target = req.body.username;
            user_name = oper_target;
        }
        else if('/user/logout' == url){
            oper_name = '用户退出';
            oper_target = req.session.user.user_name;
            user_name = oper_target;
            req.session.user={};
        }
        else if('/user/update' == url){
            oper_name = '用户更新';
            oper_target = req.body.user_id;
        }
        else if('/dict/save'   == url){
            oper_name = '字典表录入';
            oper_target = req.body.dict_type;
        }
        else if('/dict/delete' == url){
            oper_name = '字典表删除';
            oper_target = req.body.dict_type+":"+req.body.dict_value;
        }
        else if('/perm/one/2'  == url){
            oper_name = '副管理员权限更新';
        }
        else if('/perm/one/1'  == url){
            oper_name = '普通用户权限更新';
        } else {
            next();
        }
        var now = new Date();
        var log = new Log({
            oper_name:oper_name, 
            user_name:req.session.user ? req.session.user.user_name : (req.body.username ? req.body.username : user_name), 
            oper_time:now.getFullYear()+'-'+(now.getMonth()+1)+'-'+now.getDate()+' '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds(),
            oper_target:oper_target
        });
        log.save();
        next();
    }
}

exports.perm2 = function(req, res) {
    var perm_string="";
    for (var url in req.body){
        perm_string += url+'&';
    }
    if (perm_string.indexOf('&') > -1){
        perm_string = perm_string.substring(0, perm_string.length-1);
    }
    Perm.findOneAndUpdate({perm_type:'副管理员'}, {$set:{perm_string:perm_string}}, function(error, perm){
        res.json({data:perm});
    });
}
exports.perm1 = function(req, res) {
    var perm_string="";
    for (var url in req.body){
        perm_string += url+'&';
    }
    if (perm_string.indexOf('&') > -1){
        perm_string = perm_string.substring(0, perm_string.length-1);
    }
    Perm.findOneAndUpdate({perm_type:'普通用户'}, {$set:{perm_string:perm_string}}, function(error, perm){
        res.json({data:perm});
    });
}
exports.getPermForUser = function(req, res) {
    Perm.findOne({perm_type:req.session.user.user_role}, function(error, perm){
        res.json({perm_string:perm.perm_string}); 
    });
}
exports.getCurrUser = function(req, res) {
   res.json({data: req.session.user, }); 
}