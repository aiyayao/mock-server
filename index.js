const Koa = require('koa');
const cors = require('koa2-cors');
const logger = require('koa-logger');
const Router = require('koa-router');
const glob = require('glob');
const { resolve } = require('path');
const fs = require('fs');

const app = new Koa();
const router = new Router({prefix: '/api'});
const routerMap = {};

app
  .use(logger())
  .use(cors({
    origin: function(ctx) {
      if (ctx.url === '/test') {
        return false;
      }
      return '*';
    },
    exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
    maxAge: 5,
    credentials: true,
    allowMethods: ['GET', 'POST', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
  }));

// 注册路由
glob.sync(resolve('./api', '**/*.json')).forEach((item) => {
  let apiJsonPath = item && item.split('/api')[1];
  let apiPath = apiJsonPath.replace('.json', '');
  router.get(apiPath, (ctx, next) => {
    try {
      let jsonStr = fs.readFileSync(item).toString();
      ctx.body = {
        data: JSON.parse(jsonStr),
        state: 200,
        type: 'success'
      };
    } catch(err) {
      ctx.throw('Internal Server Error.', 500);
    }
  });
  routerMap[apiJsonPath] = apiPath;
});

fs.writeFile('./routerMap.json', JSON.stringify(routerMap, null, 4), err => {
  if (!err) {
    console.log('路由地图生成成功！');
  }
})

app.use(router.routes()).use(router.allowedMethods());

app.listen(5000);