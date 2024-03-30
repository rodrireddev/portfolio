export interface Itag {
  color: string;
  tagName: string;
}

export interface IFrontProjects {
  title: string;
  description: string;
  pubDate: string;
  imgSrc: string;
  imgAlt: string;
  draft: boolean;
  tags?: Itag[];
}
