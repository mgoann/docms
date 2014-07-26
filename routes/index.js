var mongoose = require('mongoose');
var db = mongoose.createConnection('127.0.0.1', 'docmc');
var DocSchema = require('../models/doc.js').DocSchema;
var SeqSchema = require('../models/seq.js').SequenceSchema;
var Seq = db.model('sequence', SeqSchema);
var Doc = db.model('doc', DocSchema);

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

//保存档案信息

exports.saveDoc = function(req, res) {
    console.log('saveDoc started');
    var now = new Date().getTime();
    var reqBody = req.body, docObj = {
        doc_name : reqBody.doc_name,
        doc_type : reqBody.doc_type,
        doc_tag : reqBody.doc_tag,
        project_name : reqBody.project_name,
        total_num : reqBody.total_num,
        store_num : reqBody.total_num,
        create_time : now,
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
  
  console.log("user_name="+user_name);
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
  if (user_id === 'on') {
      console.log(user_id);
      paramsstr += '"user_id":true,';
  }
  if (create_user === 'on') {
      console.log(create_user);
      paramsstr += '"create_user":true,';
  }
  if (paramsstr.indexOf(",") > -1){
  	paramsstr = paramsstr.substring(0, paramsstr.length-1);
  }
  paramsstr += '}';
  console.log("paramsstr=" + paramsstr);
  var params = eval("("+paramsstr+")");
  //调用mongodb查询用户信息
  SchoolInfo.find(params, {_id:1,user_name:1,ranking:1,isvalid:1,user_role:1,user_class:1, user_id:1, create_user:1}).sort({average_score:-1, ranking:1}).skip(req.body.start).limit(req.body.length).exec(function(error, schoolInfos) {
      SchoolInfo.count(params).exec(function (err, count) {
          res.json({
              draw: req.body.draw,
              recordsTotal: count,
              recordsFiltered: count,
              data: schoolInfos, 
          })
        });
  });
};

//查询院校信息
exports.getSchoolNames = function(req, res) {
    console.log('getSchoolNames started');
    var name_startsWith = req.query.name_startsWith;
    var maxRows = req.query.maxRows;
    console.log('name_startsWith=' + name_startsWith);
    //调用mongodb查询院校信息
    School.find({name: { $regex: name_startsWith}}, {name:1}).limit(maxRows).exec(function(error, schools) {
        res.json(schools);
    });
};

//查询院校招生计划
exports.getSchoolPlan = function(req, res) {
    console.log('getSchoolPlan started');
    var _id = req.query._id;
    console.log('_id=' + _id);
    //调用mongodb查询院校信息
    SchoolInfo.findOne({_id: _id}, {plan_hire_num:1,apply_num:1,enrolled_num:1}).exec(function(error, data) {
        res.json(data);
    });
};

//查询往3年分数信息
exports.getSchoolInfoScores = function(req, res) {
    console.log('getSchoolInfoScores started');
    var _id = req.query._id;
    var school_name = req.query.school_name;
    var batch_name = req.query.batch_name;
    var student_class = req.query.student_class;
    console.log('_id=' + _id + ", school_name=" + school_name + ", batch_name=" + batch_name + ", student_class=" + student_class);
    //调用mongodb查询院校信息
    SchoolInfo.find({school_name:school_name, batch_name:batch_name, student_class:student_class}, {year:1,tidang_score:1,average_score:1,max_score:1}).exec(function(error, data) {
        res.json({
            datas: data
        });
    });
};

//查询往3年分数信息
exports.getSchoolInfoPlans = function(req, res) {
    console.log('getSchoolInfoPlans started');
    var _id = req.query._id;
    var school_name = req.query.school_name;
    var batch_name = req.query.batch_name;
    var student_class = req.query.student_class;
    console.log('_id=' + _id + ", school_name=" + school_name + ", batch_name=" + batch_name + ", student_class=" + student_class);
    //调用mongodb查询院校信息
    SchoolInfo.find(
        {school_name:school_name, batch_name:batch_name, student_class:student_class}, 
        {year:1,plan_hire_num:1,apply_num:1,enrolled_num:1}
    ).exec(function(error, data) {
        res.json({
            datas: data
        });
    });
};

//查询考生去向
exports.getDistributionInfo = function(req, res) {
    console.log('getDistributionInfo started');
    var year = req.body.year;
    var batch_name = req.body.batch_name;
    var student_class = req.body.student_class;
    var paramsstr = "{";
    if (year !== undefined) {
        paramsstr += '"year":'+year+',';
    }
    if (batch_name !== undefined && batch_name !== "") {
        paramsstr += '"batch_name":"'+batch_name+'",';
    }
    if (student_class !== undefined && student_class !== "") {
        paramsstr += '"student_class":"'+student_class+'",';
    }
    if (paramsstr.indexOf(",") != -1)
        paramsstr = paramsstr.substring(0, paramsstr.length-1);
    paramsstr += '}';
    console.log("paramsstr=" + paramsstr);
    var params = eval("("+paramsstr+")");
    
    console.log('year=' + year + ", batch_name=" + batch_name + ", student_class=" + student_class);
    //构造分组条件
    var group = {
            key: {region_name:1},
            cond: params,
            $reduce: function(schoolInfo, out) {
               out.plan_hire_num += schoolInfo.plan_hire_num;
               out.apply_num += schoolInfo.apply_num;
               out.enrolled_num += schoolInfo.enrolled_num;
            },
            initial: {
                plan_hire_num: 0,
                apply_num: 0,
                enrolled_num: 0,
                hot_star: 0,
                scale_num: 0,
            },
            $finalize: function(out) {
                out.hot_star = out.apply_num / out.enrolled_num;
            },
            sort: {enrolled_num: -1}
     };
    
    SchoolInfo.aggregate([
                                 {$match : params},
                                 //{$project: {region_name: 1, year: 1, plan_hire_num:1, apply_num:1, enrolled_num:1}}, 
                                 //{$unwind: "$region_name"}, 
                                 {$group: {
                                        _id:"$region_name", 
                                        'plan_hire_num': {$sum: "$plan_hire_num"}, 
                                        'apply_num': {$sum: "$apply_num"},
                                        'enrolled_num': {$sum: "$enrolled_num"},
                                     }
                                 },
                                 {$sort : {'plan_hire_num' : -1}}], 
function(err, results) {
        console.log('group results %j', results);
        var total_plan_hire_num = 0,total_apply_num = 0, total_enrolled_num = 0;
        for (i in results) {
            total_plan_hire_num += results[i].plan_hire_num;
            total_apply_num += results[i].apply_num;
            total_enrolled_num += results[i].enrolled_num;
        }
        console.log(total_plan_hire_num +","+total_apply_num+","+total_enrolled_num);
        for (i in results) {
            results[i].total_plan_hire_num = total_plan_hire_num;
            results[i].total_apply_num = total_apply_num;
            results[i].total_enrolled_num = total_enrolled_num;
            
            results[i].plan_scale_num = parseFloat(results[i].plan_hire_num / total_plan_hire_num * 100).toFixed(3); 
            results[i].enrolled_scale_num = parseFloat(results[i].enrolled_num / total_enrolled_num * 100).toFixed(3) ; 
            results[i].apply_scale_num = parseFloat(results[i].apply_num / total_apply_num * 100).toFixed(3) ;
            results[i].hot_star = (parseFloat(results[i].apply_num / results[i].plan_hire_num * 100).toFixed(0))  + ':100';
        }
        res.json({
            draw: req.body.draw,
            recordsTotal: results.length,
            recordsFiltered: results.length,
            data: results, 
        })
    });
    /*SchoolInfo.find(
        {school_name:school_name, batch_name:batch_name, student_class:student_class}, 
        {year:1,plan_hire_num:1,apply_num:1,enrolled_num:1}
    ).exec(function(error, data) {
        res.json({
            datas: data
        });
    });*/
};

//查询考生Top10去向
exports.getDistributionInfoTop10 = function(req, res) {
    console.log('getDistributionInfo started');
    var year = req.body.year;
    var batch_name = req.body.batch_name;
    var student_class = req.body.student_class;
    var region_name = req.body.region_name;
    var paramsstr = "{";
    if (year !== undefined) {
        paramsstr += '"year":'+year+',';
    }
    if (batch_name !== undefined && batch_name !== "") {
        paramsstr += '"batch_name":"'+batch_name+'",';
    }
    if (student_class !== undefined && student_class !== "") {
        paramsstr += '"student_class":"'+student_class+'",';
    }
    if (region_name !== undefined && region_name !== "") {
        paramsstr += '"region_name":"'+region_name+'",';
    }
    paramsstr += '}';
    console.log("paramsstr=" + paramsstr);
    var params = eval("("+paramsstr+")");
    
    //构造分组条件
    var group = {
            key: {school_name:1},
            cond: params,
            $reduce: function(schoolInfo, out) {
               out.plan_hire_num += schoolInfo.plan_hire_num;
               out.apply_num += schoolInfo.apply_num;
               out.enrolled_num += schoolInfo.enrolled_num;
            },
            initial: {
                plan_hire_num: 0,
                apply_num: 0,
                enrolled_num: 0,
                hot_star: 0,
                scale_num: 0,
            },
            $finalize: function(out) {
                out.hot_star = out.apply_num / out.enrolled_num;
            },
            sort: {enrolled_num: -1}
     };
    
    SchoolInfo.aggregate([
                                 {$match : params},
                                 //{$project: {region_name: 1, year: 1, plan_hire_num:1, apply_num:1, enrolled_num:1}}, 
                                 //{$unwind: "$region_name"}, 
                                 {$group: {
                                        _id:"$school_name", 
                                        'plan_hire_num': {$sum: "$plan_hire_num"}, 
                                        'apply_num': {$sum: "$apply_num"},
                                        'enrolled_num': {$sum: "$enrolled_num"},
                                     }
                                 },
                                 {$sort : {'plan_hire_num' : -1}},
                                 {$limit : 10},
                           ], 
function(err, results) {
        console.log('group results %j', results);
        var total_plan_hire_num = 0,total_apply_num = 0, total_enrolled_num = 0;
        for (i in results) {
            total_plan_hire_num += results[i].plan_hire_num;
            total_apply_num += results[i].apply_num;
            total_enrolled_num += results[i].enrolled_num;
        }
        console.log(total_plan_hire_num +","+total_apply_num+","+total_enrolled_num);
        for (i in results) {
            results[i].total_plan_hire_num = total_plan_hire_num;
            results[i].total_apply_num = total_apply_num;
            results[i].total_enrolled_num = total_enrolled_num;
            
            results[i].plan_scale_num = parseFloat(results[i].plan_hire_num / total_plan_hire_num * 100).toFixed(3); 
            results[i].enrolled_scale_num = parseFloat(results[i].enrolled_num / total_enrolled_num * 100).toFixed(3) ; 
            results[i].apply_scale_num = parseFloat(results[i].apply_num / total_apply_num * 100).toFixed(3) ;
            results[i].hot_star = (parseFloat(results[i].apply_num / results[i].plan_hire_num * 100).toFixed(0))  + ':100';
        }
        res.json({
            draw: req.body.draw,
            recordsTotal: results.length,
            recordsFiltered: results.length,
            data: results, 
        })
    });
    /*SchoolInfo.find(
        {school_name:school_name, batch_name:batch_name, student_class:student_class}, 
        {year:1,plan_hire_num:1,apply_num:1,enrolled_num:1}
    ).exec(function(error, data) {
        res.json({
            datas: data
        });
    });*/
};

