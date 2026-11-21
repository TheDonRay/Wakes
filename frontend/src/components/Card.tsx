import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type Props = {
  title: string;
  icon: IconName;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function Card({ title, icon, aside, className, children }: Props) {
  return (
    <section className={`card ${className ?? ""}`} aria-label={title}>
      <header className="card-head">
        <span className="icon-ring">
          <Icon name={icon} />
        </span>
        <h2>{title}</h2>
        {aside ? <div className="card-aside">{aside}</div> : null}
      </header>
      {children}
    </section>
  );
}
