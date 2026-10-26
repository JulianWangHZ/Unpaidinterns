import type { ReactNode } from 'react';
import type { Route } from '../lib/route.js';
import { SettingsMenu } from './settings/SettingsMenu.js';
import { ViewTabs } from './ViewTabs.js';

/** The row above (or over) the content: view tabs on the left, settings on the right. */
export function ViewBar({ route, children, className = '' }: { route: Route; children?: ReactNode; className?: string }) {
  return (
    <div className={`view-bar ${className}`.trim()}>
      <div className="view-bar-start">
        <ViewTabs route={route} />
        {children}
      </div>
      <SettingsMenu />
    </div>
  );
}
