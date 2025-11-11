import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString } from "class-validator"

export class ReviewReplyDTO {
    @ApiProperty({
        description:"here will pass the reviw id ",
        example:"409584-44i5450-45j"
    })
    @IsString()
    @IsNotEmpty()
    reviewId:string

    @ApiProperty({
        description:"Here will pass the reply of review",
        example:"Yes ! you are right"
    })
    @IsString()
    @IsNotEmpty()
    comment:string
}