import type { MarkdownInstance } from 'astro';
import type { IFrontmatter } from 'astro-boilerplate-components';
import {
  ColorTags,
  GradientText,
  Project,
  Section,
  Tags,
} from 'astro-boilerplate-components';

type IRecentProjectProps = {
  postList: MarkdownInstance<IFrontmatter>[];
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
        {props?.postList.map((item) => {
          return (
            <Project
              name={item.frontmatter.title}
              description={item.frontmatter.description}
              link="/"
              img={{
                src: item.frontmatter.imgSrc,
                alt: item.frontmatter.imgAlt,
              }}
              category={
                <>
                  {item?.frontmatter?.tags?.map((itemTag) => {
                    return (
                      <Tags color={ColorTags.FUCHSIA}>{itemTag.tagName}</Tags>
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
