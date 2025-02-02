import axios from 'axios';

import type { PagedResponse } from './api';
import type { Rate, RateRequest } from './rates';

export interface CostModelProvider {
  name: string;
  uuid: string;
}

export interface CostModel {
  created_timestamp?: Date;
  currency?: string;
  description: string;
  distribution_info?: {
    distribution_type?: string;
    platform_cost?: boolean;
    worker_cost?: boolean;
  };
  markup: { value: string; unit: string };
  name: string;
  rates: Rate[];
  sources?: CostModelProvider[];
  source_type: string;
  updated_timestamp?: Date;
  uuid?: string;
}

export interface CostModelRequest {
  currency?: string;
  description: string;
  distribution_info?: {
    distribution_type?: string;
    platform_cost?: boolean;
    worker_cost?: boolean;
  };
  markup: { value: string; unit: string };
  name: string;
  rates: RateRequest[];
  source_type: string;
  source_uuids: string[];
}

export type CostModels = PagedResponse<CostModel>;

export function fetchCostModels(query = '') {
  return axios.get<CostModels>(`cost-models/${query && '?'}${query}`);
}

export function fetchCostModel(uuid: string) {
  return axios.get<CostModels>(`cost-models/${uuid}/`);
}

export function addCostModel(request: CostModelRequest) {
  return axios.post(`cost-models/`, request);
}

export function updateCostModel(uuid: string, request: CostModelRequest) {
  return axios.put(`cost-models/${uuid}/`, request);
}

export function deleteCostModel(uuid: string) {
  return axios.delete(`cost-models/${uuid}/`);
}
