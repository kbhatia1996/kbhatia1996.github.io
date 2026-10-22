import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Project {
  title: string;
  description: string;
  tags: string[];
  url?: string;
}

@Component({
  selector: 'app-work',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './work.component.html',
  styleUrl: './work.component.scss'
})
export class WorkComponent {
  activeProject: number | null = null;

  projects: Project[] = [
    {
      title: 'Resume Screening Assistant',
      description: 'A personal project exploring how AI can organize resume details and compare them with role requirements.',
      tags: ['AI', 'Document Processing', 'Angular'],
      url: 'https://medium.com/@kbhatia1996/build-your-own-ai-powered-resume-screening-assistant-with-n8n-langchain-and-angular-0944132a35eb'
    },
    {
      title: 'Financial Report Summarizer',
      description: 'A tool that turns long financial documents into concise summaries and answers questions about their content.',
      tags: ['AI', 'Document Summarization', 'Python'],
    },
    {
      title: 'Semantic Product Search',
      description: 'A search experience that matches what people mean with relevant product descriptions.',
      tags: ['AI', 'Search', 'Angular'],
    },
  ];
}
