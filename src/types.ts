export interface StudentData {
  時間戳記: string;
  姓名: string;
  班級座號: string;
  主題: string;
  日期: string;
  Input: string;
  Process: string;
  Outcome: string;
  Feedback: string;
  反思1: string;
  反思2: string;
  反思3: string;
  教師回饋?: string;
  [key: string]: string | undefined;
}
