
/**
 * Module dependencies.
 */
var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

var app = express();

// 设置环境变量
app.set('port', process.env.PORT || 3000);
//app.set('views', __dirname + '/views');
//app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// 开发模式
if ('development' == app.get('env')) {
  console.log('development is start');
  app.use(express.errorHandler());
}

//设置控制器
app.post('/doc/save', routes.saveDoc);
app.get('/school/names', routes.getSchoolNames);
app.get('/schoolInfo/plan', routes.getSchoolPlan);
app.get('/schoolInfo/scores', routes.getSchoolInfoScores);
app.get('/schoolInfo/plans', routes.getSchoolInfoPlans);
app.post('/distribution/all', routes.getDistributionInfo);
app.post('/distribution/top10', routes.getDistributionInfoTop10);

//创建http server
var server = http.createServer(app);
//var io = require('socket.io').listen(server);

//io.sockets.on('connection', routes.vote);

//监听端口
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
