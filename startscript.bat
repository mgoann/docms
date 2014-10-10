start "Repair Data" /min /wait "D:\qipengfei\devpro\MongoDB\bin\mongod.exe" --config "D:\qipengfei\devpro\MongoDB\bin\test" --repair
start "MongoDB" /min /wait /b "D:\qipengfei\devpro\MongoDB\bin\mongod.exe" --config "D:\qipengfei\devpro\MongoDB\bin\mongodb.config"
start "Nodejs" /min /wait "node" "D:\qipengfei\persional\docms\app.js" > "D:\qipengfei\persional\docms\app.log"

