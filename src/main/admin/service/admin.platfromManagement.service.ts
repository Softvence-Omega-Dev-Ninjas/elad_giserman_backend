import { PrismaService } from "@/lib/prisma/prisma.service";
import { BadRequestException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { PlatformFilter } from "../dto/getPlatform.dto";
import { UpdateStatusDto } from "../dto/updateStatus.dto";

@Injectable()
export class AdminPlatfromManagementService {
 constructor( private readonly prisma:PrismaService){}

    async getPlatfromStat(filter:PlatformFilter){
    const {search,date,userType}=filter
    const where:any={}
    if(search){
        where.OR=[
            {name:{contains:search,mode:"insensetive"}},
            {email:{contains:search,mode:"insensetive"}},
            {mobile:{contains:search,mode:"insensetive"}}

        ]
    }
    if(userType){
        where.memberShip=userType
    }
   if (date) {
    const selected = new Date(date);
    const nextDay = new Date(selected);
    nextDay.setDate(selected.getDate() + 1);
    //This ensures only records created on that calendar date are matched
    where.createdAt = {
      gte: selected,
      lt: nextDay,
    };
  }

  const [totalUser, totalFreeUser, totalOrganizer,users] = await Promise.all([
    this.prisma.user.count(),
    this.prisma.user.count({
      where: {
        memberShip: "FREE"
      }
    }),
    this.prisma.user.count({
      where: {
        role: "ORGANIZER"
      }
    }),
    this.prisma.user.findMany({
        where
    })
  ]);
    const totalVipMember=totalUser-totalFreeUser
 return{
    totalUser:totalUser,
    totalFreeUser:totalFreeUser,
    totalVipUser:totalVipMember,
    totalOrganizer:totalOrganizer,
    users:users
 }

    }


    //  get user details
     async getUserDetils(userId:string){
        if(!userId){
            throw new NotFoundException("user id is requird")
        }
        const isUserExist=await this.prisma.user.findUnique({
            where:{
                id:userId
            }
        })
        if(!isUserExist){
            throw new NotFoundException(`User not found with id ${userId}`)
        }
      return isUserExist
     }


    //  delete user 
    async deleteuser(userId:string){
        if(!userId){
            throw new BadRequestException('User Id is requrid')
        }
        const isUserExist=await this.prisma.user.findUnique({
            where:{
                id:userId
            }
        })
        if(!isUserExist){
            throw new NotFoundException(`User not found with given id ${userId}`)
        }
        await this.prisma.user.delete({
            where:{
                id:userId
            }
        })
        return{
            status:HttpStatus.OK,
            message:"User delete successful"
        }
    }


    // update user status
    async UpdateUserStatus(dto:UpdateStatusDto,userId:string){
        if(!userId){
            throw new BadRequestException("user id is required")
        }
        const isUserExist=await this.prisma.user.findUnique({
            where:{
                id:userId
            }
        })
         if(!isUserExist){
            throw new NotFoundException(`User not found with given id ${userId}`)
        }
       await this.prisma.user.update({
        where:{
            id:userId
        },
        data:{
            status:dto.status
        }
       })
       return{
        status:HttpStatus.OK,
        message:`User update to ${dto.status}`
       }
    }
}