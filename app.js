
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
app.use(express.cookieParser('Authentication Tutorial '));
app.use(express.session());
app.set('view engine', 'jade');
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


// 开发模式
if ('development' == app.get('env')) {
  console.log('development is start');
  app.use(express.errorHandler());
}

//设置控制器
app.post('/doc/save',  routes.requiredAuthentication, routes.saveDoc);
app.post('/doc/update',  routes.requiredAuthentication,routes.updateDoc);
app.post('/doc/delete',  routes.requiredAuthentication,routes.deleteDoc);
app.post('/doc/all', routes.getDocAll);
app.post('/doc/brower',  routes.requiredAuthentication,routes.browerDoc);
app.post('/doc/back',  routes.requiredAuthentication,routes.backDoc);
app.post('/brower/all', routes.getbrowreAll);
app.post('/fileupload',  routes.requiredAuthentication,routes.saveImageFile);
app.post('/fileuploaddoc',  routes.requiredAuthentication,routes.saveDocFile);
app.post('/user/save',  routes.requiredAuthentication,routes.saveUser); // 用户新增
app.post('/user/delete',  routes.requiredAuthentication,routes.deleteUser); // 用户删除
app.post('/user/all', routes.getUserInfo); // 列表：用户查询
app.post('/user/one', routes.getUserByID); // 单个：用户查询
app.post('/user/login',  routes.requiredAuthentication,routes.userLogin); // 用户登录
app.post('/user/logout',  routes.requiredAuthentication,routes.userLogout); // 用户登出
app.post('/user/update',  routes.requiredAuthentication,routes.updateUser); // 用户修改
app.post('/dict/one', routes.getDictOne); // 字典表查询
app.post('/dict/all', routes.getDict); // 字典表查询
app.post('/dict/save',  routes.requiredAuthentication,routes.saveDict); // 字典表查询
app.post('/dict/delete',  routes.requiredAuthentication,routes.deleteDict); // 字典表查询
app.post('/perm/one/2',  routes.requiredAuthentication,routes.perm2); // 权限修改
app.post('/perm/one/1',  routes.requiredAuthentication,routes.perm1); // 权限修改
app.get('/perm/user', routes.getPermForUser); // 获取当前用户权限
app.get('/user/curr', routes.getCurrUser); // 获取当前用户信息
app.post('/log/all', routes.getLogAll); // 查询操作日志

app.get('/ajax/*.html',routes.requiredAuthentication);
app.get('/*.html',routes.requiredAuthentication);

//创建http server
var server = http.createServer(app);
//var io = require('socket.io').listen(server);

//io.sockets.on('connection', routes.vote);

//监听端口
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
