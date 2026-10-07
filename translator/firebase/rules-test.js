// Kiểm thử quy tắc Firestore bằng Firebase Emulator (Node 18+).
// Chạy: trong thư mục firebase/, `npx firebase-tools emulators:start --only firestore,auth --project demo-sonadezi`,
// rồi ở cửa sổ khác: `node rules-test.js`. Kết quả mong đợi: tất cả các dòng PASS.
const AUTH='http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake';
const FS='http://127.0.0.1:8080/v1/projects/demo-sonadezi/databases/(default)/documents';
const signUp=async()=>{const r=await fetch(AUTH,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({returnSecureToken:true})});const j=await r.json();return {tok:j.idToken,uid:j.localId};};
const S=v=>({stringValue:v}), T=ms=>({timestampValue:new Date(ms).toISOString()}), I=n=>({integerValue:String(n)}), B=v=>({booleanValue:v});
async function call(method,path,tok,fields,mask){
  let url=FS+path; if(mask) url+=(url.includes('?')?'&':'?')+mask.map(m=>'updateMask.fieldPaths='+encodeURIComponent(m)).join('&');
  const r=await fetch(url,{method,headers:{'Content-Type':'application/json',...(tok?{Authorization:'Bearer '+tok}:{})},body:fields?JSON.stringify({fields}):undefined});
  return r.status;
}
let pass=0,fail=0; const t=(name,got,exp)=>{ const ok=exp==='ok'?got===200:got===403; ok?pass++:fail++; console.log((ok?'PASS':'FAIL')+' | '+name+' -> '+got+' (mong '+(exp==='ok'?200:403)+')'); };
(async()=>{
 const A=await signUp(), Bv=await signUp(), now=Date.now(), id='testroom1234567890abcd';
 const room=(exp)=>({hostUid:S(A.uid),createdAt:I(now),expiresAt:T(exp),status:S('open'),hostSrc:S('vi'),hostTgt:S('en')});
 t('Chủ tạo phòng hợp lệ (24h)',await call('PATCH','/rooms/'+id,A.tok,room(now+24*3600e3)),'ok');
 t('Tạo phòng hạn 48h bị chặn',await call('PATCH','/rooms/bad1bad1bad1bad1bad1',A.tok,room(now+48*3600e3)),'deny');
 t('Tạo phòng với hostUid của người khác bị chặn',await call('PATCH','/rooms/bad2bad2bad2bad2bad2',Bv.tok,room(now+24*3600e3)),'deny');
 t('Tạo phòng mã ngắn bị chặn',await call('PATCH','/rooms/short',A.tok,room(now+24*3600e3)),'deny');
 t('Người xem đọc phòng khi biết mã',await call('GET','/rooms/'+id,Bv.tok),'ok');
 t('Không đăng nhập đọc phòng bị chặn',await call('GET','/rooms/'+id,null),'deny');
 t('Liệt kê danh sách phòng bị chặn',await call('GET','/rooms',Bv.tok),'deny');
 const msg={src:S('xin chào'),out:S('hello'),from:S('vi'),to:S('en'),ts:I(now),meeting:B(false),expiresAt:T(now+24*3600e3),tr:{mapValue:{fields:{}}}};
 t('Người xem ghi tin nhắn bị chặn',await call('PATCH','/rooms/'+id+'/messages/m1',Bv.tok,msg),'deny');
 t('Chủ ghi tin nhắn',await call('PATCH','/rooms/'+id+'/messages/m1',A.tok,msg),'ok');
 t('Người xem đọc tin nhắn',await call('GET','/rooms/'+id+'/messages',Bv.tok),'ok');
 t('Không đăng nhập đọc tin nhắn bị chặn',await call('GET','/rooms/'+id+'/messages',null),'deny');
 t('Người xem sửa bản dịch bị chặn',await call('PATCH','/rooms/'+id+'/messages/m1',Bv.tok,{tr:{mapValue:{fields:{zh:S('x')}}}},['tr']),'deny');
 t('Chủ thêm bản dịch',await call('PATCH','/rooms/'+id+'/messages/m1',A.tok,{tr:{mapValue:{fields:{zh:S('你好')}}}},['tr']),'ok');
 t('Chủ sửa nội dung gốc bị chặn',await call('PATCH','/rooms/'+id+'/messages/m1',A.tok,{src:S('đã sửa')},['src']),'deny');
 t('Ghi tin nhắn có trường lạ bị chặn',await call('PATCH','/rooms/'+id+'/messages/m2',A.tok,{...msg,evil:S('x')}),'deny');
 t('Người xem ghi hồ sơ của chính mình',await call('PATCH','/rooms/'+id+'/viewers/'+Bv.uid,Bv.tok,{lang:S('en'),ts:I(now),expiresAt:T(now+24*3600e3)}),'ok');
 t('Người xem ghi hồ sơ cho người khác bị chặn',await call('PATCH','/rooms/'+id+'/viewers/'+A.uid,Bv.tok,{lang:S('en'),ts:I(now),expiresAt:T(now+24*3600e3)}),'deny');
 t('Người xem liệt kê danh sách người xem bị chặn',await call('GET','/rooms/'+id+'/viewers',Bv.tok),'deny');
 t('Chủ liệt kê người xem',await call('GET','/rooms/'+id+'/viewers',A.tok),'ok');
 const live={utt:S('u1'),src:S('xin chào các'),out:S('hello'),from:S('vi'),to:S('en'),ts:I(now),expiresAt:T(now+24*3600e3)};
 t('Chủ ghi bản đang nói (live/now)',await call('PATCH','/rooms/'+id+'/live/now',A.tok,live),'ok');
 t('Người xem ghi bản đang nói bị chặn',await call('PATCH','/rooms/'+id+'/live/now',Bv.tok,live),'deny');
 t('Người xem đọc bản đang nói',await call('GET','/rooms/'+id+'/live/now',Bv.tok),'ok');
 t('Không đăng nhập đọc bản đang nói bị chặn',await call('GET','/rooms/'+id+'/live/now',null),'deny');
 t('Ghi live với mã tài liệu khác "now" bị chặn',await call('PATCH','/rooms/'+id+'/live/other',A.tok,live),'deny');
 t('Ghi live có trường lạ bị chặn',await call('PATCH','/rooms/'+id+'/live/now',A.tok,{...live,evil:S('x')}),'deny');
 t('Ghi tin nhắn có trường utt',await call('PATCH','/rooms/'+id+'/messages/m3',A.tok,{...msg,utt:S('u1')}),'ok');
 t('Người xem xóa bản đang nói bị chặn',await call('DELETE','/rooms/'+id+'/live/now',Bv.tok),'deny');
 t('Chủ xóa bản đang nói',await call('DELETE','/rooms/'+id+'/live/now',A.tok),'ok');
 // Máy thứ hai (cohost)
 const C=await signUp(), D=await signUp(), code='abcdefghjkmnpqrstuvwxyz234';
 const cohost=c=>({code:S(c),ts:I(now),expiresAt:T(now+24*3600e3)});
 t('Người xem đọc mã mời bị chặn',await call('GET','/rooms/'+id+'/secret/code',Bv.tok),'deny');
 t('Người khác tạo mã mời bị chặn',await call('PATCH','/rooms/'+id+'/secret/code',Bv.tok,{code:S(code)}),'deny');
 t('Chủ tạo mã mời',await call('PATCH','/rooms/'+id+'/secret/code',A.tok,{code:S(code)}),'ok');
 t('Chủ đọc mã mời',await call('GET','/rooms/'+id+'/secret/code',A.tok),'ok');
 t('Máy thứ hai nhập sai mã bị chặn',await call('PATCH','/rooms/'+id+'/cohosts/'+C.uid,C.tok,cohost('saimasaimasaimasaima')),'deny');
 t('Máy thứ hai chưa ghi danh không ghi tin được',await call('PATCH','/rooms/'+id+'/messages/c0',C.tok,msg),'deny');
 t('Ghi danh máy thứ hai cho người khác bị chặn',await call('PATCH','/rooms/'+id+'/cohosts/'+D.uid,C.tok,cohost(code)),'deny');
 t('Máy thứ hai nhập đúng mã',await call('PATCH','/rooms/'+id+'/cohosts/'+C.uid,C.tok,cohost(code)),'ok');
 t('Máy thứ hai ghi tin nhắn (có trường by)',await call('PATCH','/rooms/'+id+'/messages/c1',C.tok,{...msg,by:S('co')}),'ok');
 t('Máy thứ hai không thêm bản dịch (chỉ chủ)',await call('PATCH','/rooms/'+id+'/messages/c1',C.tok,{tr:{mapValue:{fields:{zh:S('x')}}}},['tr']),'deny');
 t('Máy thứ hai ghi live/co',await call('PATCH','/rooms/'+id+'/live/co',C.tok,live),'ok');
 t('Máy thứ hai ghi live/now bị chặn',await call('PATCH','/rooms/'+id+'/live/now',C.tok,live),'deny');
 t('Chủ ghi live/co bị chặn',await call('PATCH','/rooms/'+id+'/live/co',A.tok,live),'deny');
 t('Người xem liệt kê máy thứ hai bị chặn',await call('GET','/rooms/'+id+'/cohosts',Bv.tok),'deny');
 t('Chủ liệt kê máy thứ hai',await call('GET','/rooms/'+id+'/cohosts',A.tok),'ok');
 t('Chủ thêm bản dịch cho tin của máy thứ hai',await call('PATCH','/rooms/'+id+'/messages/c1',A.tok,{tr:{mapValue:{fields:{zh:S('你好')}}}},['tr']),'ok');
 t('Chủ kéo dài hạn phòng bị chặn',await call('PATCH','/rooms/'+id,A.tok,{expiresAt:T(now+48*3600e3)},['expiresAt']),'deny');
 t('Người khác đóng phòng bị chặn',await call('PATCH','/rooms/'+id,Bv.tok,{status:S('closed')},['status']),'deny');
 t('Chủ đóng phòng',await call('PATCH','/rooms/'+id,A.tok,{status:S('closed')},['status']),'ok');
 // phòng hết hạn
 const id2='expiredroom12345678ab';
 t('Tạo phòng hết hạn sau 2 giờ (để thử hết hạn)',await call('PATCH','/rooms/'+id2,A.tok,room(now+2*3600e3)),'ok');
 t('Chủ rút ngắn hạn về quá khứ',await call('PATCH','/rooms/'+id2,A.tok,{expiresAt:T(now-1000)},['expiresAt']),'ok');
 t('Phòng hết hạn: người xem không đọc được',await call('GET','/rooms/'+id2,Bv.tok),'deny');
 t('Phòng hết hạn: chủ không ghi thêm tin',await call('PATCH','/rooms/'+id2+'/messages/m1',A.tok,msg),'deny');
 console.log(`\nKẾT QUẢ: ${pass} đạt, ${fail} lỗi`);
})();
