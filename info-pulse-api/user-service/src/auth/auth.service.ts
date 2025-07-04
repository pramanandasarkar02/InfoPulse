// import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { JwtService } from '@nestjs/jwt';
// import * as bcrypt from 'bcrypt';
// import { User } from '../entities/user.entity';
// import { CreateUserDto, LoginDto, ChangePasswordDto } from './dto/auth.dto';

// @Injectable()
// export class AuthService {
//   constructor(
//     @InjectRepository(User)
//     private userRepository: Repository<User>,
//     private jwtService: JwtService,
//   ) {}

//   async signup(createUserDto: CreateUserDto): Promise<{ access_token: string }> {
//     const { email, name, password } = createUserDto;

//     // Check if user already exists
//     const existingUser = await this.userRepository.findOne({ where: { email } });
//     if (existingUser) {
//       throw new ConflictException('User with this email already exists');
//     }

//     // Hash password
//     const saltRounds = 10;
//     const hashedPassword = await bcrypt.hash(password, saltRounds);

//     // Create user
//     const user = this.userRepository.create({
//       email,
//       name,
//       password: hashedPassword,
//     });

//     const savedUser = await this.userRepository.save(user);

//     // Generate JWT token
//     const payload = { sub: savedUser.id, email: savedUser.email };
//     return {
//       access_token: await this.jwtService.signAsync(payload),
//     };
//   }

//   async login(loginDto: LoginDto): Promise<{ access_token: string }> {
//     const { email, password } = loginDto;

//     // Find user by email
//     const user = await this.userRepository.findOne({ where: { email } });
//     if (!user) {
//       throw new UnauthorizedException('Invalid credentials');
//     }

//     // Verify password
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       throw new UnauthorizedException('Invalid credentials');
//     }

//     // Generate JWT token
//     const payload = { sub: user.id, email: user.email };
//     return {
//       access_token: await this.jwtService.signAsync(payload),
//     };
//   }

//   async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<void> {
//     const { currentPassword, newPassword } = changePasswordDto;

//     // Find user
//     const user = await this.userRepository.findOne({ where: { id: userId } });
//     if (!user) {
//       throw new UnauthorizedException('User not found');
//     }

//     // Verify current password
//     const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
//     if (!isCurrentPasswordValid) {
//       throw new UnauthorizedException('Current password is incorrect');
//     }

//     // Hash new password
//     const saltRounds = 10;
//     const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

//     // Update password
//     await this.userRepository.update(userId, { password: hashedNewPassword });
//   }
// }
