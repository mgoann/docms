var mongoose = require('mongoose');
var db = mongoose.createConnection('localhost', 'pollsapp');
var PollSchema = require('../models/Poll.js').PollSchema;
var Poll = db.model('polls', PollSchema);
exports.index = function(req, res) {
    res.render('index', {
        title : '档案管理系统'
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



// JSON API for list of polls
exports.list = function(req, res) {
    Poll.find({}, 'question', function(error, polls) {
        res.json(polls);
    });
};
// JSON API for getting a single poll
exports.poll = function(req, res) {
    var pollId = req.params.id;
    Poll.findById(pollId, '', {
        lean : true
    }, function(err, poll) {
        if (poll) {
            var userVoted = false, userChoice, totalVotes = 0;
            for (c in poll.choices) {
                var choice = poll.choices[c];
                for (v in choice.votes) {
                    var vote = choice.votes[v];
                    totalVotes++;
                    if (vote.ip === (req.header('x-forwarded-for') || req.ip)) {
                        userVoted = true;
                        userChoice = {
                            _id : choice._id,
                            text : choice.text
                        };
                    }
                }
            }
            poll.userVoted = userVoted;
            poll.userChoice = userChoice;
            poll.totalVotes = totalVotes;
            res.json(poll);
        } else {
            res.json({
                error : true
            });
        }
    });
};
// JSON API for creating a new poll
exports.create = function(req, res) {
    var reqBody = req.body, choices = reqBody.choices.filter(function(v) {
        return v.text != '';
    }), pollObj = {
        question : reqBody.question,
        choices : choices
    };
    var poll = new Poll(pollObj);
    poll.save(function(err, doc) {
        if (err || !doc) {
            throw 'Error';
        } else {
            res.json(doc);
        }
    });
};

// Socket API for saving a vote
exports.vote = function(socket) {
  socket.on('send:vote', function(data) {
    var ip = socket.handshake.headers['x-forwarded-for'] || 
socket.handshake.address.address;    
    Poll.findById(data.poll_id, function(err, poll) {
      var choice = poll.choices.id(data.choice);
      choice.votes.push({ ip: ip });      
      poll.save(function(err, doc) {
        var theDoc = { 
          question: doc.question, _id: doc._id, choices: doc.choices, 
          userVoted: false, totalVotes: 0 
        };
        for(var i = 0, ln = doc.choices.length; i < ln; i++) {
          var choice = doc.choices[i]; 
          for(var j = 0, jLn = choice.votes.length; j < jLn; j++) {
            var vote = choice.votes[j];
            theDoc.totalVotes++;
            theDoc.ip = ip;
            if(vote.ip === ip) {
              theDoc.userVoted = true;
              theDoc.userChoice = { _id: choice._id, text: choice.text };
            }
          }
        }       
        socket.emit('myvote', theDoc);
        socket.broadcast.emit('vote', theDoc);
      });     
    });
  });
};