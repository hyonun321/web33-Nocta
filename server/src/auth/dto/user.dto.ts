import { ApiProperty } from "@nestjs/swagger";

export class UserDto {
  @ApiProperty({
    description: "The unique identifier of the user",
    example: "5f8f8c44b54764421b7156c9",
  })
  id: string;

  @ApiProperty({
    description: "The email address of the user",
    example: "user@example.com",
  })
  email: string;

  @ApiProperty({
    description: "The name of the user",
    example: "John Doe",
  })
  name: string;
}
