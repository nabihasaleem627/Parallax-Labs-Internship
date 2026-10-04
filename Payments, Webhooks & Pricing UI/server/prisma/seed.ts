import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma=new PrismaClient();
async function main(){
  const passwordHash=await bcrypt.hash('demo123',12);
  const user=await prisma.user.upsert({where:{email:'alex@northstar.co'},update:{},create:{name:'Alex Morgan',email:'alex@northstar.co',passwordHash}});
  const tenant=await prisma.tenant.upsert({where:{slug:'northstar-studio'},update:{},create:{name:'Northstar Studio',slug:'northstar-studio',timezone:'America/New_York'}});
  await prisma.membership.upsert({where:{userId_tenantId:{userId:user.id,tenantId:tenant.id}},update:{},create:{userId:user.id,tenantId:tenant.id,role:'OWNER'}});
  await prisma.subscription.upsert({where:{tenantId:tenant.id},update:{},create:{tenantId:tenant.id,plan:'FREE',status:'none'}});
  const customer=await prisma.customer.upsert({where:{tenantId_email:{tenantId:tenant.id,email:'sophia@atlasdesign.co'}},update:{},create:{tenantId:tenant.id,name:'Sophia Bennett',email:'sophia@atlasdesign.co'}});
  const existing=await prisma.booking.count({where:{tenantId:tenant.id}});
  if(!existing)await prisma.booking.create({data:{tenantId:tenant.id,customerId:customer.id,service:'Strategy consultation',startsAt:new Date('2026-10-05T14:30:00Z'),endsAt:new Date('2026-10-05T15:30:00Z'),amount:18000,status:'CONFIRMED'}});
  console.log('Seeded BookFlow demo workspace. Login: alex@northstar.co / demo123');
}
main().finally(()=>prisma.$disconnect());
