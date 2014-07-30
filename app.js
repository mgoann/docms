
/**
 * Module dependencies.
 */
var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , fs = require('fs');


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
app.post('/doc/update', routes.updateDoc);
app.post('/doc/delete', routes.deleteDoc);
app.post('/doc/all', routes.getDocAll);
app.post('/doc/brower', routes.browerDoc);
app.post('/doc/back', routes.backDoc);
app.post('/brower/all', routes.getbrowreAll);
app.post('/fileupload', routes.saveImageFile);
app.post('/fileuploaddoc', routes.saveDocFile);
app.post('/user/save', routes.saveUser); // 用户新增
app.post('/user/delete', routes.deleteUser); // 用户删除
app.post('/user/all', routes.getUserInfo); // 列表：用户查询
app.post('/user/one', routes.getUserByID); // 单个：用户查询
app.get('/user/toupdate/:user_id', routes.toUserModify); //跳转到修改页面
app.post('/user/update', routes.updateUser); // 用户修改
app.post('/dict/all', routes.getDict); // 字典表查询
app.post('/dict/save', routes.saveDict); // 字典表查询
app.post('/dict/delete', routes.deleteDict); // 字典表查询
//创建http server
var server = http.createServer(app);
//var io = require('socket.io').listen(server);

//io.sockets.on('connection', routes.vote);

//监听端口
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
