import type { SelectOptionObject } from '@patternfly/react-core';
import { Select, SelectOption, SelectVariant, ToolbarItem } from '@patternfly/react-core';
import { intl } from 'components/i18n';
import messages from 'locales/messages';
import React from 'react';

import type { Filters } from './common';
import { hasFilters } from './common';

export interface ExcludeOption extends SelectOptionObject {
  toString(): string; // label
  value?: string;
}

// eslint-disable-next-line no-shadow
export const enum ExcludeType {
  exclude = 'exclude',
  include = 'include',
}

// Exclude select

export const getExcludeSelect = ({
  currentExclude,
  filters,
  handleOnExcludeSelect,
  handleOnExcludeToggle,
  isDisabled,
  isExcludeSelectOpen,
}: {
  currentExclude?: string;
  filters?: Filters;
  handleOnExcludeSelect: (event: any, selection: ExcludeOption) => void;
  handleOnExcludeToggle: (isOpen: boolean) => void;
  isDisabled?: boolean;
  isExcludeSelectOpen?: boolean;
}) => {
  const selectOptions = getExcludeSelectOptions();
  const selection = selectOptions.find((option: ExcludeOption) => option.value === currentExclude);

  return (
    <ToolbarItem>
      <Select
        id="exclude-select"
        isDisabled={isDisabled && !hasFilters(filters)}
        isOpen={isExcludeSelectOpen}
        onSelect={handleOnExcludeSelect}
        onToggle={handleOnExcludeToggle}
        selections={selection}
        variant={SelectVariant.single}
      >
        {selectOptions.map(option => (
          <SelectOption key={option.value} value={option} />
        ))}
      </Select>
    </ToolbarItem>
  );
};

export const getExcludeSelectOptions = (): ExcludeOption[] => {
  const excludeOptions = [
    { name: intl.formatMessage(messages.excludeValues, { value: 'excludes' }), key: ExcludeType.exclude },
    { name: intl.formatMessage(messages.excludeValues, { value: 'includes' }), key: ExcludeType.include },
  ];

  const options: ExcludeOption[] = [];
  excludeOptions.map(option => {
    options.push({
      toString: () => option.name,
      value: option.key,
    });
  });
  return options;
};
