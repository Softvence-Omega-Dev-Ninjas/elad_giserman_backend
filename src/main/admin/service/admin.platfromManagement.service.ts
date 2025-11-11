import { PrismaService } from "@/lib/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { PlatformFilter } from "../dto/getPlatform.dto";

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
}