const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'chapter-8-9.html'),'utf8');
const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
const data=Object.fromEntries(scripts.filter(m=>/id=/.test(m[1])).map(m=>[m[1].match(/id="([^"]+)"/)[1],m[2]]));
const js=scripts.at(-1)[2],context={document:{getElementById:id=>({textContent:data[id]})}};
vm.runInNewContext(js.slice(0,js.indexOf('function cleanState'))+'\nglobalThis.grading={isCorrect,allBlanks};})();',context);
const {isCorrect,allBlanks}=context.grading;
test('8~9장 원문·주석과 모든 등록 정답 유지',()=>{
 const original=JSON.parse(fs.readFileSync(path.join(root,'authoring/source-8-9.json'),'utf8'));
 assert.deepEqual(JSON.parse(data['content-data']),original);assert.equal(original.length,2);
 assert.equal(new Set(allBlanks.map(b=>b.id)).size,allBlanks.length);
 let count=0;for(const b of allBlanks)for(const a of b.answers){assert.equal(isCorrect(b,a),true,b.id+' '+a);count++;}assert.ok(count>1000);
 assert.ok(js.includes("const STORE='ie8-9-cloze-v1'"));
});
test('부호·소수점·분수 순서·지수·괄호·부등호 방향 구분',()=>{
 const checks=[
  ['0.816','0.816입니다',true],['0.816','−0.816',false],['0.816','0.0816',false],
  ['1280','1,280',true],['1280','−1280',false],['0','0.00',true],
  ['1/λ','λ⁻¹',true],['1/λ','람다의 역수입니다',true],['1/λ','λ/1',false],['1/λ','λ−1',false],
  ['np(1-p)','n*p*(1-p)',true],['np(1-p)','np1-p',false],['np(1-p)','np(1+p)',false],
  ['n-1','n−1',true],['n-1','n+1',false],['n-1','n1',false],
  ['0 이하','≤0',true],['0 이하','≥0',false],
  ['-1 이상 1 이하','−1≤r≤1',true],['-1 이상 1 이하','1≤r≤1',false],
  ['r²','r^2',true],['r²','r',false],['94.65%','9.465%',false],
  ['최대화','최소화',false],['모집단','표본',false],['Validation','Verification',false],
 ];
 for(const [a,v,expected] of checks){const b=allBlanks.find(b=>b.answers.includes(a));assert.ok(b,a);assert.equal(isCorrect(b,v),expected,a+' ← '+v);}
});
test('교재 생산계획 예제 해의 가능성과 최적값을 독립 계산',()=>{
 const x=[0,4,0,8],profit=[60,80,100,120],A=[[10,10,20,20],[6,2,4,2],[10,14,2,4]],b=[200,24,100];
 assert.equal(x.reduce((sum,v,i)=>sum+v*profit[i],0),1280);
 assert.deepEqual(A.map(row=>row.reduce((sum,v,i)=>sum+v*x[i],0)),[200,24,88]);
 // A nonnegative dual bound proves no feasible production plan exceeds 1,280.
 const dual=[4,20,0];
 for(let j=0;j<4;j++)assert.ok(A.reduce((sum,row,i)=>sum+row[j]*dual[i],0)>=profit[j]-1e-9);
 assert.ok(Math.abs(b.reduce((sum,v,i)=>sum+v*dual[i],0)-1280)<1e-9);
});

