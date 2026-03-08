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
      title: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      date: '2023',
      credentialId: 'AWS-123456',
      description: 'Demonstrated expertise in designing distributed systems on AWS.'
    },
    {
      title: 'Google Cloud Professional Developer',
      issuer: 'Google Cloud',
      date: '2022',
      credentialId: 'GCP-789012',
      description: 'Proficient in developing scalable applications on Google Cloud Platform.'
    },
    {
      title: 'Certified Kubernetes Administrator',
      issuer: 'Cloud Native Computing Foundation',
      date: '2022',
      credentialId: 'CKA-345678',
      description: 'Skilled in deploying and managing Kubernetes clusters.'
    },
    {
      title: 'Angular Developer Certification',
      issuer: 'Google',
      date: '2021',
      credentialId: 'ANG-901234',
      description: 'Expertise in building dynamic web applications with Angular.'
    },
    {
      title: 'Machine Learning Engineer',
      issuer: 'Coursera',
      date: '2021',
      credentialId: 'ML-567890',
      description: 'Comprehensive knowledge of machine learning algorithms and implementation.'
    },
    {
      title: 'Full Stack Web Development',
      issuer: 'Udacity',
      date: '2020',
      credentialId: 'FSWD-123456',
      description: 'Proficiency in both frontend and backend web development technologies.'
    }
  ];
}
