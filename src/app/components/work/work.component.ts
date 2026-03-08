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
      description: 'An AI-powered tool that automates the initial screening of resumes, extracting key information and ranking candidates based on job requirements.',
      tags: ['Angular', 'RAG', 'Langchain', 'ChromaDB', 'AWS S3'],
    },
    {
      title: 'Electricity Consumption Dashboard',
      description: 'Containerized microservice-based application to monitor and analyze electricity consumption patterns.',
      tags: ['Angular', 'SpringBoot', 'AWS Lambda', 'Docker'],
    },
    {
      title: 'Financial report RAG Summarizer',
      description: 'A tool that uses Retrieval-Augmented Generation (RAG) to summarize financial reports, extracting key insights and trends for investors.',
      tags: ['Python', 'Langchain', 'ChromaDB', 'AWS S3'],
    },
    {
      title: 'Customer Feedback Classifier',
      description: 'A machine learning model that categorizes and analyzes customer feedback to identify common themes and sentiment.',
      tags: ['Python', 'Scikit-learn', 'Pandas'],
    },
  ];
}
