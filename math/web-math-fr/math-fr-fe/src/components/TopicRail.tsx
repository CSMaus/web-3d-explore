import { Link, useRouterState } from "@tanstack/react-router";
import { Label, SideNav, SideNavLink } from "@kit/index";
import { Tex } from "@/components/Tex";
import { pagesOf } from "@/lib/rail";
import { useRailIndex } from "@/lib/railIndex";
import type { BuiltTopic } from "@/lib/topic";

const UNDER_MENU = 96;

/**
 * the navigation inside a topic, as one menu: the way back to the topics, the
 * topic's name, its sections, and under the section the reader is in, its
 * pages in their groups, or the index of a long page. the router marks the
 * current page; the open section is marked by its edge and its chevron.
 */
export function TopicRail({ topic }: { topic: BuiltTopic }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const index = useRailIndex();
  const name = `${topic.number === 0 ? "Start here" : `Topic ${topic.number}`} - ${topic.title}`;
  const jump = (id: string) => (event: React.MouseEvent) => {
    const node = document.getElementById(id);
    if (!node) return;
    event.preventDefault();
    index.go(id);
    const top = node.getBoundingClientRect().top + window.scrollY - UNDER_MENU;
    window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
    history.replaceState(null, "", `#${id}`);
  };
  return (
    <SideNav label={name}>
      <div data-slot="side-nav-title">
        <Link to="/topics" data-text="crumb" activeOptions={{ exact: true }}>
          Topics
        </Link>
        <span data-text="topic">{name}</span>
      </div>
      <ul data-slot="side-nav-sections">
        {topic.sections.map((section) => {
          const inside = path.startsWith(section.to);
          const groups = inside ? pagesOf(topic, section.to) : [];
          const longPage = inside && groups.length === 0 && index.items.length > 0;
          return (
            <li key={section.to}>
              <SideNavLink asChild level="section" data-open={inside || undefined}>
                <Link to={section.to} activeOptions={{ exact: true }}>
                  {section.label}
                </Link>
              </SideNavLink>
              {groups.length ? (
                <ul data-slot="side-nav-pages">
                  {groups.map((group, i) => (
                    <li key={group.heading ?? i}>
                      {group.heading ? <Label as="div">{group.heading}</Label> : null}
                      <ul>
                        {group.links.map((link) => (
                          <li key={link.label}>
                            <SideNavLink asChild>
                              <Link to={link.to} params={link.params as never} activeOptions={link.exact ? { exact: true } : undefined}>
                                <span>
                                  {link.label}
                                  {link.tex ? (
                                    <>
                                      <span aria-hidden="true"> | </span>
                                      <span role="img" aria-label={link.texSaid} className="inline-block align-middle">
                                        <Tex tex={link.tex} />
                                      </span>
                                    </>
                                  ) : null}
                                </span>
                              </Link>
                            </SideNavLink>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              ) : null}
              {longPage ? (
                <ul data-slot="side-nav-pages" aria-label="On this page">
                  <li>
                    <ul>
                      {index.items.map((item) => (
                        <li key={item.id}>
                          <SideNavLink href={`#${item.id}`} onClick={jump(item.id)} aria-current={item.id === index.here ? "location" : undefined}>
                            {item.label}
                          </SideNavLink>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </SideNav>
  );
}
