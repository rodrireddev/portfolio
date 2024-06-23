import type { MarkdownInstance } from 'astro';
import {
  ColorTags,
  GradientText,
  Project,
  Section,
  Tags,
} from 'astro-boilerplate-components';

import type { IFrontProjects } from '@/types/Project';

type IRecentProjectProps = {
  postList: MarkdownInstance<IFrontProjects>[];
};

const RecentProjects = (props: IRecentProjectProps) => {
  return (
    <Section
      title={
        <div className="flex items-baseline justify-between">
          <div>
            Recent <GradientText>Projects</GradientText>
          </div>
          <div className="text-sm">
            <a href="/projects/">View all Projects →</a>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {props?.postList.map((item: any) => {
          return (
            <Project
              name={item.frontmatter.title}
              description={item.frontmatter.description}
              link={item.url}
              img={{
                src: item.frontmatter.imgSrc,
                alt: item.frontmatter.imgAlt,
              }}
              key={item.frontmatter.title}
              category={
                <>
                  {item?.frontmatter?.tags?.map((itemTag: string) => {
                    return (
                      <Tags key={itemTag} color={ColorTags.AMBER}>
                        {itemTag}
                      </Tags>
                    );
                  })}
                </>
              }
            />
          );
        })}
      </div>
    </Section>
  );
};

export { RecentProjects };
