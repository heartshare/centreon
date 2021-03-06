import { ListingModel } from '@centreon/ui';

export interface Icon {
  url: string;
  name: string;
}

type ParentLinks = Pick<ResourceLinks, 'uris'>;

export interface Parent {
  id: number;
  name: string;
  icon: Icon | null;
  status: Status;
  links: ParentLinks;
  type?: string;
}

export interface Status {
  severity_code: number;
  name: string;
}

export interface Severity {
  name: string;
  level: number;
}

export interface Resource {
  id: number;
  name: string;
  icon?: Icon;
  parent?: Parent;
  status: Status;
  downtime_endpoint?: string;
  acknowledged: boolean;
  acknowledgement_endpoint?: string;
  in_downtime: boolean;
  duration: string;
  tries: string;
  last_check: string;
  information: string;
  severity?: Severity;
  short_type: 'h' | 's';
  performance_graph_endpoint?: string;
  type: 'host' | 'service';
  details_endpoint: string;
  timeline_endpoint: string;
  configuration_uri?: string;
  logs_uri?: string;
  reporting_uri?: string;
}

export type ResourceListing = ListingModel<Resource>;

export interface Downtime {
  author_name: string;
  comment: string;
  entry_time: string;
  start_time: string;
  end_time: string;
}

export interface Acknowledgement {
  author_name: string;
  comment: string;
  entry_time: string;
  is_persistent: boolean;
  is_sticky: boolean;
}

export interface ResourceEndpoints {
  details: string;
  performanceGraph?: string;
  timeline: string;
}

export interface ResourceUris {
  configuration?: string;
  logs?: string;
  reporting?: string;
}

export interface ResourceLinks {
  endpoints: ResourceEndpoints;
  uris: ResourceUris;
}
