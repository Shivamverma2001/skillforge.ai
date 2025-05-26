"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function updateUser(data:any) {
    const {userId} = await auth();
    if(!userId){
        throw new Error("Unauthorized");
    }

    const user = await db.user.findUnique({
        where:{
            clerkUserId:userId
        }
    })

    if(!user){
        throw new Error("User not found");
    }

    try {
        const result:any = await db.$transaction(
            async (tx)=>{
                let industryInsight = await tx.industryInsight.findUnique({
                    where:{
                        industry: data.industry
                    }
                });

                if(!industryInsight){
                    industryInsight = await tx.industryInsight.create({
                        data:{
                            industry: data.industry,
                            salaryRanges: [],
                            growthRate: 0,
                            demandLevel: "MEDIUM",
                            topSkills: [],
                            marketOutlook: "NEUTRAL",
                            keyTrends:  [],
                            recommendedSkills: [],
                            nextUpdate: new Date(Date.now() + 1000 * 60 * 60 * 24*7) //every 7 days
                        }
                    })
                }

                const updatedUser = await tx.user.update({
                    where:{
                        id: user.id
                    },
                    data:{
                        industry:data.industry,
                        experience: data.experience,
                        bio: data.bio,
                        skills: data.skills
                    }
                });

                return { updateUser: updatedUser, industryInsight: industryInsight };
            },
            {
                timeout:10000,
            }
        );

        return result.user;
    } catch (error:any) {
        console.error("Error updating user and industries", error.message);
        throw new Error("Failed to update user and industries");
    }
}

export async function getUserOnboardingStatus() {
    const {userId} = await auth();
    if(!userId){
        throw new Error("Unauthorized");
    }

    const user = await db.user.findUnique({
        where:{
            clerkUserId:userId
        }
    })

    if(!user){
        throw new Error("User not found");
    }

    try {
        const user = await db.user.findUnique({
            where:{
                clerkUserId:userId
            },
            select:{
                industry:true
            }
        });

        return {
            isOnboarded: !!user?.industry,
        }
    } catch (error) {
        console.error("Error getting user onboarding status", error.message);
        throw new Error("Failed to get user onboarding status");
    }
}