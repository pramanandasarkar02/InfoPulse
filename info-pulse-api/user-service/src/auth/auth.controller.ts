// import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import { CreateUserDto, LoginDto, ChangePasswordDto } from './dto/auth.dto';


// @Controller('auth')
// export class AuthController {
//   constructor(private authService: AuthService) {}

//   @Post('signup')
//   async signup(@Body() createUserDto: CreateUserDto) {
//     return this.authService.signup(createUserDto);
//   }

//   @HttpCode(HttpStatus.OK)
//   @Post('login')
//   async login(@Body() loginDto: LoginDto) {
//     return this.authService.login(loginDto);
//   }

//   @UseGuards(JwtAuthGuard)
//   @Post('change-password')
//   async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
//     await this.authService.changePassword(req.user.sub, changePasswordDto);
//     return { message: 'Password changed successfully' };
//   }

//   @UseGuards(JwtAuthGuard)
//   @Post('logout')
//   async logout() {
//     // In a real application, you might want to blacklist the token
//     // For now, we'll just return a success message
//     return { message: 'Logged out successfully' };
//   }
// }
