import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, validate } from '../utils/http.js';
const router=Router();router.use(authenticate);
router.get('/',asyncHandler(async(req,res)=>{const customers=await prisma.customer.findMany({where:{tenantId:req.auth!.tenantId},include:{_count:{select:{bookings:true}}},orderBy:{name:'asc'}});res.json({success:true,data:customers})}));
router.post('/',asyncHandler(async(req,res)=>{const input=validate(z.object({name:z.string().min(2).max(80),email:z.string().email(),phone:z.string().max(30).optional()}),req.body);const customer=await prisma.customer.create({data:{...input,email:input.email.toLowerCase(),tenantId:req.auth!.tenantId}});res.status(201).json({success:true,data:customer,message:'Customer created.'})}));
export default router;
