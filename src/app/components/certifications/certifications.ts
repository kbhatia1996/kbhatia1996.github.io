import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Certification {
  title: string;
  issuer: string;
  date: string;
  credentialId?: string;
  description?: string;
}

@Component({
  selector: 'app-certifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certifications.component.html',
  styleUrl: './certifications.component.scss'
})
export class CertificationsComponent {
  certifications: Certification[] = [
    {
      title: 'Machine Learning Specialisation',
      issuer: 'Stanford/Coursera',
      date: 'July-2025',
      credentialId: '05L8NC6YW5AO',
      description: 'Comprehensive knowledge of machine learning algorithms and implementation.'
    },
     {
      title: 'SPARCS program - Angular + Java Full stack + Spring',
      issuer: 'Accenture',
      date: 'April 2025',
      credentialId: '41146f84-2df1-434c-86c9-a0ad18f6b10a',
      description: 'Completed a comprehensive training program covering Angular, Java Full Stack, and Spring Framework.'
    },
    {
      title: 'AWS Partner - GEN AI with AWS',
      issuer: 'Amazon Web Services',
      date: 'April 2025',
      credentialId: '41146f84-2df1-434c-86c9-a0ad18f6b10a',
      description: 'Completed a comprehensive training program covering GEN AI with AWS offered tools.'
    },
    {
      title: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      date: 'March 2024',
      credentialId: '0fedb6ff2b3540808beacbceaaa0e990',
      description: 'Demonstrated expertise in designing distributed systems on AWS.'
    },
    {
      title: 'Dele A1 Spanish',
      issuer: 'DELE',
      date: 'November 2023',
      credentialId: '231101356001010026',
      description: 'Achieved A1 level proficiency in Spanish language, demonstrating basic communication skills.'
    },
    {
      title: 'Microsoft Certified: Azure AZ-900 Fundamentals and DP-900 Data Fundamentals',
      issuer: 'Microsoft',
      date: 'July 2021',
      credentialId: 'H906-1018 / H922-9809',
      description: 'Proficient in developing scalable applications on Microsoft Azure Platform.'
    }
  ];
}
