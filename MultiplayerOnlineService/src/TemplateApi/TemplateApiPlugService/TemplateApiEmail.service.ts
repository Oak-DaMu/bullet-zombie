/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
 
@Injectable()
export class TemplateApiMailService {
 
    private transporter: nodemailer.Transporter;
 
    constructor(
        private readonly config: ConfigService
    ) {
        // 创建一个Nodemailer transporter实例
        this.transporter = nodemailer.createTransport({
            host: 'smtp.qq.com', // SMTP服务器主机
            port: 465, // SMTP服务器端口
            secure: true, // 使用 SSL
            auth: {
                user: this.config.get('template.email_auth_user'), // 发件邮箱
                pass: this.config.get('template.TEMPLATE_MAIL_AUTH_PASS'), // 授权码
            },
        });
    };
 
    async sendVerificationCode(email:string, code: string){
        const mailOptions: nodemailer.SendMailOptions = {
            from: this.config.get('template.email_auth_user'), // 发件邮箱
            to: email, // 收件邮箱
            subject: 'Verification Code', // 邮件主题
            text: `Your verification code is: ${code}`, // 邮件正文
        };
 
        // 发送邮件
        await this.transporter.sendMail(mailOptions);
    };
    
};