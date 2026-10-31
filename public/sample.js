export const demo = Object.freeze({
  original:'record_id,customer,status,amount\nA001,Demo One,Pending,100\nA002,Demo Two,Pending,250\n',
  blocked:'record_id,customer,status,amount\nA001,Demo One,Approved,900\nA002,Demo Two,Pending,250\n',
  reviewable:'record_id,customer,status,amount\nA001,Demo One,Approved,100\nA002,Demo Two,Pending,250\n',
  contract:{keyColumn:'record_id', requiredColumns:['record_id','customer','status','amount'],editableColumns:['status']}
});
