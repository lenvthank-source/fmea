// Historical baseline diagnostic. No DB connection or real token generation.
const path = require('node:path');
const { createRequire } = require('node:module');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../../..');
const backendRequire = createRequire(path.join(root, 'backend/package.json'));
backendRequire('ts-node').register({transpileOnly:true,project:path.join(root,'backend/tsconfig.json')});
const { AuthService } = backendRequire('./src/modules/auth/auth.service');
const { UserService } = backendRequire('./src/modules/user/user.service');
(async () => {
  let stored, archiveWhere;
  const tx = {
    publicHandleReservation: {findMany:async()=>[],createMany:async()=>({count:1})},
    user:{create:async({data})=>{stored={id:'synthetic-user',...data,lastLoginAt:data.lastLoginAt??null,lastActivityAt:data.lastActivityAt??null,userRoles:[]};return stored;}},
    role:{findFirst:async()=>({id:'synthetic-role'}),findUnique:async()=>({rolePermissions:[]})},
    permission:{findUnique:async()=>null},userRole:{create:async()=>({})}
  };
  const prisma = {
    tenant:{findUnique:async()=>({id:'synthetic-tenant',name:'Synthetic',subdomain:'guest-tenant'})},
    $transaction:async(fn)=>fn(tx),
    user:{findUnique:async()=>stored,update:async({data})=>{Object.assign(stored,data);return stored;},updateMany:async({where})=>{archiveWhere=where;return {count:0};}}
  };
  const auth=new AuthService(prisma,{}, {get:()=>undefined});
  auth.generateTokens=async()=>({access_token:'synthetic-not-a-real-token',refresh_token:'synthetic-not-a-real-token'});
  const result=await auth.createGuestUser();
  assert.equal(result.isGuest,true);
  assert.equal(stored.lastLoginAt,null);
  assert.equal(stored.lastActivityAt,null);
  console.log('REPRODUCED: guest session succeeds while both activity timestamps are null.');
  await auth.getMe('synthetic-tenant','synthetic-user');
  assert.ok(stored.lastActivityAt instanceof Date);
  assert.equal(stored.lastLoginAt,null);
  console.log('REPRODUCED: /me records activity, but lastLoginAt remains null, so the current admin cell still says Never logged in.');
  await new UserService(prisma).checkAndArchiveInactiveUsers('synthetic-tenant');
  assert.ok(!JSON.stringify(archiveWhere).includes('lastActivityAt'));
  console.log('CONFIRMED: archive predicate does not read lastActivityAt.');
  console.log('ISOLATION: mocked Prisma and token signing only; no database, accounts or real sessions used.');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
