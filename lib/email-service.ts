import nodemailer from 'nodemailer'

// Email configuration - you'll need to set these environment variables
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
}

// Create transporter
const transporter = nodemailer.createTransport(emailConfig)

export interface InvitationEmailData {
  customerEmail: string
  customerName: string
  programName: string
  coachName: string
  coachBusinessName: string
  invitationLink: string
}

export async function sendInvitationEmail(data: InvitationEmailData): Promise<boolean> {
  try {
    const mailOptions = {
      from: `"${data.coachBusinessName}" <${process.env.SMTP_USER}>`,
      to: data.customerEmail,
      subject: `You're invited to join ${data.programName} by ${data.coachBusinessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">You're Invited!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Join ${data.programName}</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${data.customerName},</h2>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              You've been invited by <strong>${data.coachName}</strong> from <strong>${data.coachBusinessName}</strong> 
              to join their coaching program: <strong>${data.programName}</strong>.
            </p>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 30px;">
              This is an exclusive opportunity to work with a professional coach and transform your skills. 
              Click the button below to accept the invitation and get started on your journey.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.invitationLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Accept Invitation
              </a>
            </div>
            
            <div style="background: #e9ecef; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <p style="margin: 0; color: #495057; font-size: 14px;">
                <strong>Program:</strong> ${data.programName}<br>
                <strong>Coach:</strong> ${data.coachName}<br>
                <strong>Organization:</strong> ${data.coachBusinessName}
              </p>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 30px;">
              If you have any questions, please contact ${data.coachName} directly.
            </p>
          </div>
          
          <div style="background: #343a40; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0; font-size: 12px; opacity: 0.8;">
              © ${new Date().getFullYear()} ${data.coachBusinessName}. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `
        You're invited to join ${data.programName} by ${data.coachBusinessName}
        
        Hello ${data.customerName},
        
        You've been invited by ${data.coachName} from ${data.coachBusinessName} 
        to join their coaching program: ${data.programName}.
        
        This is an exclusive opportunity to work with a professional coach and transform your skills. 
        Click the link below to accept the invitation and get started on your journey.
        
        Invitation Link: ${data.invitationLink}
        
        Program: ${data.programName}
        Coach: ${data.coachName}
        Organization: ${data.coachBusinessName}
        
        If you have any questions, please contact ${data.coachName} directly.
      `
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Error sending invitation email:', error)
    return false
  }
}

// For development/testing without actual email service
export async function sendInvitationEmailMock(data: InvitationEmailData): Promise<boolean> {
  console.log('=== MOCK EMAIL SENT ===')
  console.log('To:', data.customerEmail)
  console.log('Subject: You\'re invited to join', data.programName, 'by', data.coachBusinessName)
  console.log('Invitation Link:', data.invitationLink)
  console.log('=======================')
  return true
}

// Use real email service when SMTP credentials are configured
export const sendEmail = process.env.SMTP_USER && process.env.SMTP_PASS
  ? sendInvitationEmail 
  : sendInvitationEmailMock
