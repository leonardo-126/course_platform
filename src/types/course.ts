export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  price: number;
  duration: string;
  category: string;
  rating: number;
  students: number;
  image?: string;
}
