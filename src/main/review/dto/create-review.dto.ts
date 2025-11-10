import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsNumber, IsString } from "class-validator"

export class CreateReviewDto {
    @ApiProperty({
    example: "Great service and friendly staff!",
    })
    @IsString()
    @IsNotEmpty()
  comment:string

  @ApiProperty({
    example: 5,
  })
  @IsNumber()
  @IsNotEmpty()
  rating:number

  @ApiProperty({
    example:"4545-5454-4k45"
  })
  @IsString()
  @IsNotEmpty()
  businessProfileId:string
}
