export interface Article {
    id: string;
    title: string;
    content: string;
    url: string;
    insertion_date: string;
    summerylarge?: string;
    summerysmall?: string;
    keywords: string[];
    topics: string[];
    images: string[];
}

