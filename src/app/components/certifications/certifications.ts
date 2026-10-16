import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Certification {
  title: string;
  issuer?: string;
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
      title: 'AWS Certified Solutions Architect – Associate',
      issuer: 'Amazon Web Services'
    },
    {
      title: 'Azure Fundamentals (AZ-900)',
      issuer: 'Microsoft'
    },
    {
      title: 'Azure Data Fundamentals (DP-900)',
      issuer: 'Microsoft'
    },
    {
      title: 'LangChain LLM Development (OpenAI)'
    },
    {
      title: 'Machine Learning Specialization',
      issuer: 'Stanford Online / Coursera'
    }
  ];
}
