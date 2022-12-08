import { Title, TitleSizes } from '@patternfly/react-core';
import type { Providers } from 'api/providers';
import { ProviderType } from 'api/providers';
import { getProvidersQuery } from 'api/queries/providersQuery';
import type { Query } from 'api/queries/query';
import { parseQuery } from 'api/queries/query';
import { getUserAccessQuery } from 'api/queries/userAccessQuery';
import type { UserAccess } from 'api/userAccess';
import { UserAccessType } from 'api/userAccess';
import type { AxiosError } from 'axios';
import { ExportsLink } from 'components/exports';
import messages from 'locales/messages';
import React from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { Currency } from 'routes/components/currency';
import { CostType } from 'routes/views/components/costType';
import { GroupBy } from 'routes/views/components/groupBy';
import { Perspective } from 'routes/views/components/perspective';
import { DateRangeType, getDateRangeFromQuery, getDateRangeTypeDefault } from 'routes/views/utils/dateRange';
import type { Filter } from 'routes/views/utils/filter';
import { filterProviders, hasCloudProvider } from 'routes/views/utils/providers';
import { getRouteForQuery } from 'routes/views/utils/query';
import { createMapStateToProps, FetchStatus } from 'store/common';
import { featureFlagsSelectors } from 'store/featureFlags';
import { providersQuery, providersSelectors } from 'store/providers';
import { userAccessQuery, userAccessSelectors } from 'store/userAccess';
import { getIdKeyForGroupBy } from 'utils/computedReport/getComputedExplorerReportItems';
import type { CostTypes } from 'utils/costType';
import type { RouterComponentProps } from 'utils/router';
import { withRouter } from 'utils/router';
import {
  hasAwsAccess,
  hasAzureAccess,
  hasGcpAccess,
  hasIbmAccess,
  isAwsAvailable,
  isAzureAvailable,
  isGcpAvailable,
  isIbmAvailable,
  isOciAvailable,
  isOcpAvailable,
  isRhelAvailable,
} from 'utils/userAccess';

import { ExplorerFilter } from './explorerFilter';
import { styles } from './explorerHeader.styles';
import {
  baseQuery,
  getGroupByDefault,
  getGroupByOptions,
  getOrgReportPathsType,
  getResourcePathsType,
  getTagReportPathsType,
  PerspectiveType,
} from './explorerUtils';

interface ExplorerHeaderOwnProps extends RouterComponentProps, WrappedComponentProps {
  costType?: CostTypes;
  currency?: string;
  groupBy?: string;
  onCostTypeSelected(value: string);
  onCurrencySelected(value: string);
  onDatePickerSelected(startDate: Date, endDate: Date);
  onFilterAdded(filter: Filter);
  onFilterRemoved(filter: Filter);
  onGroupBySelected(value: string);
  onPerspectiveClicked(value: string);
  perspective: PerspectiveType;
}

interface ExplorerHeaderStateProps {
  awsProviders?: Providers;
  azureProviders?: Providers;
  gcpProviders?: Providers;
  ibmProviders?: Providers;
  isCostTypeFeatureEnabled?: boolean;
  isCurrencyFeatureEnabled?: boolean;
  isExportsFeatureEnabled?: boolean;
  isFINsightsFeatureEnabled?: boolean;
  isIbmFeatureEnabled?: boolean;
  isOciFeatureEnabled?: boolean;
  ociProviders?: Providers;
  ocpProviders?: Providers;
  providers: Providers;
  providersError: AxiosError;
  providersFetchStatus: FetchStatus;
  providersQueryString: string;
  query: Query;
  rhelProviders?: Providers;
  userAccess: UserAccess;
  userAccessError: AxiosError;
  userAccessFetchStatus: FetchStatus;
  userAccessQueryString: string;
}

interface ExplorerHeaderState {
  currentPerspective?: PerspectiveType;
}

type ExplorerHeaderProps = ExplorerHeaderOwnProps & ExplorerHeaderStateProps;

class ExplorerHeaderBase extends React.Component<ExplorerHeaderProps> {
  protected defaultState: ExplorerHeaderState = {
    // TBD...
  };
  public state: ExplorerHeaderState = { ...this.defaultState };

  public componentDidMount() {
    this.setState({
      currentPerspective: this.props.perspective,
    });
  }

  public componentDidUpdate(prevProps: ExplorerHeaderProps) {
    const { perspective } = this.props;

    if (prevProps.perspective !== perspective) {
      this.setState({
        currentPerspective: this.props.perspective,
      });
    }
  }

  private getPerspective = (isDisabled: boolean) => {
    const { isIbmFeatureEnabled, isOciFeatureEnabled } = this.props;
    const { currentPerspective } = this.state;

    const hasAws = this.isAwsAvailable();
    const hasAzure = this.isAzureAvailable();
    const hasOci = this.isOciAvailable();
    const hasGcp = this.isGcpAvailable();
    const hasIbm = this.isIbmAvailable();
    const hasOcp = this.isOcpAvailable();
    const hasRhel = this.isRhelAvailable();

    // Note: No need to test "OCP on cloud" here, since that requires at least one of the providers below
    if (!(hasAws || hasAzure || hasOci || hasGcp || hasIbm || hasOcp || hasRhel)) {
      return null;
    }

    return (
      <Perspective
        currentItem={currentPerspective}
        hasAws={hasAws}
        hasAwsOcp={this.isAwsOcpAvailable()}
        hasAzure={hasAzure}
        hasAzureOcp={this.isAzureOcpAvailable()}
        hasGcp={hasGcp}
        hasGcpOcp={this.isGcpOcpAvailable()}
        hasIbm={hasIbm}
        hasIbmOcp={this.isIbmOcpAvailable()}
        hasOci={hasOci}
        hasOcp={hasOcp}
        hasOcpCloud={this.isOcpCloudAvailable()}
        hasRhel={hasRhel}
        isDisabled={isDisabled}
        isIbmFeatureEnabled={isIbmFeatureEnabled}
        isOciFeatureEnabled={isOciFeatureEnabled}
        onSelected={this.handlePerspectiveSelected}
      />
    );
  };

  private handlePerspectiveSelected = (value: string) => {
    const { onPerspectiveClicked, query, router } = this.props;

    const newQuery = {
      ...JSON.parse(JSON.stringify(query)),
      exclude: undefined,
      filter_by: undefined,
      group_by: { [getGroupByDefault(value)]: '*' },
      order_by: undefined, // Clear sort
      perspective: value,
    };
    this.setState({ currentPerspective: value }, () => {
      if (onPerspectiveClicked) {
        onPerspectiveClicked(value);
      }
      router.navigate(getRouteForQuery(newQuery, router.location), { replace: true });
    });
  };

  private isAwsAvailable = () => {
    const { awsProviders, userAccess } = this.props;
    return isAwsAvailable(userAccess, awsProviders);
  };

  private isAwsOcpAvailable = () => {
    const { awsProviders, ocpProviders, userAccess } = this.props;
    return hasAwsAccess(userAccess) && hasCloudProvider(awsProviders, ocpProviders);
  };

  private isAzureAvailable = () => {
    const { azureProviders, userAccess } = this.props;
    return isAzureAvailable(userAccess, azureProviders);
  };

  private isAzureOcpAvailable = () => {
    const { azureProviders, ocpProviders, userAccess } = this.props;
    return hasAzureAccess(userAccess) && hasCloudProvider(azureProviders, ocpProviders);
  };

  private isGcpAvailable = () => {
    const { gcpProviders, userAccess } = this.props;
    return isGcpAvailable(userAccess, gcpProviders);
  };

  private isGcpOcpAvailable = () => {
    const { gcpProviders, ocpProviders, userAccess } = this.props;
    return hasGcpAccess(userAccess) && hasCloudProvider(gcpProviders, ocpProviders);
  };

  private isIbmAvailable = () => {
    const { ibmProviders, userAccess } = this.props;
    return isIbmAvailable(userAccess, ibmProviders);
  };

  private isIbmOcpAvailable = () => {
    const { ibmProviders, ocpProviders, userAccess } = this.props;
    return hasIbmAccess(userAccess) && hasCloudProvider(ibmProviders, ocpProviders);
  };

  private isOciAvailable = () => {
    const { ociProviders, userAccess } = this.props;
    return isOciAvailable(userAccess, ociProviders);
  };

  private isOcpAvailable = () => {
    const { ocpProviders, userAccess } = this.props;
    return isOcpAvailable(userAccess, ocpProviders);
  };

  private isOcpCloudAvailable = () => {
    const hasAwsOcp = this.isAwsOcpAvailable();
    const hasAzureOcp = this.isAzureOcpAvailable();
    const hasGcpOcp = this.isGcpOcpAvailable();
    const hasIbmOcp = this.isIbmOcpAvailable();

    return hasAwsOcp || hasAzureOcp || hasGcpOcp || hasIbmOcp;
  };

  private isRhelAvailable = () => {
    const { isFINsightsFeatureEnabled, rhelProviders, userAccess } = this.props;
    return isFINsightsFeatureEnabled && isRhelAvailable(userAccess, rhelProviders);
  };

  public render() {
    const {
      costType,
      currency,
      groupBy,
      intl,
      isCostTypeFeatureEnabled,
      isCurrencyFeatureEnabled,
      isExportsFeatureEnabled,
      onCostTypeSelected,
      onCurrencySelected,
      onFilterAdded,
      onFilterRemoved,
      onGroupBySelected,
      perspective,
      providersFetchStatus,
      query,
    } = this.props;

    // Note: No need to test OCP on cloud here, since that requires at least one provider
    const noAwsProviders = !this.isAwsAvailable() && providersFetchStatus === FetchStatus.complete;
    const noAzureProviders = !this.isAzureAvailable() && providersFetchStatus === FetchStatus.complete;
    const noGcpProviders = !this.isGcpAvailable() && providersFetchStatus === FetchStatus.complete;
    const noIbmProviders = !this.isIbmAvailable() && providersFetchStatus === FetchStatus.complete;
    const noOcpProviders = !this.isOcpAvailable() && providersFetchStatus === FetchStatus.complete;
    const noRhelProviders = !this.isRhelAvailable() && providersFetchStatus === FetchStatus.complete;
    const noProviders =
      noAwsProviders && noAzureProviders && noGcpProviders && noIbmProviders && noOcpProviders && noRhelProviders;

    const groupByOptions = getGroupByOptions(perspective);
    const orgReportPathsType = getOrgReportPathsType(perspective);
    const resourcePathsType = getResourcePathsType(perspective);
    const tagReportPathsType = getTagReportPathsType(perspective);

    return (
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <Title headingLevel="h1" style={styles.title} size={TitleSizes['2xl']}>
            {intl.formatMessage(messages.explorerTitle)}
          </Title>
          <div style={styles.headerContentRight}>
            {isCurrencyFeatureEnabled && <Currency currency={currency} onSelect={onCurrencySelected} />}
            {isExportsFeatureEnabled && <ExportsLink />}
          </div>
        </div>
        <div style={styles.perspectiveContainer}>
          {this.getPerspective(noProviders)}
          <div style={styles.groupBy}>
            <GroupBy
              getIdKeyForGroupBy={getIdKeyForGroupBy}
              groupBy={groupBy}
              isDisabled={noProviders}
              onSelected={onGroupBySelected}
              options={groupByOptions}
              orgReportPathsType={orgReportPathsType}
              perspective={perspective}
              showOrgs={orgReportPathsType}
              showTags={tagReportPathsType}
              tagReportPathsType={tagReportPathsType}
            />
          </div>
          {(perspective === PerspectiveType.aws ||
            (perspective === PerspectiveType.awsOcp && isCostTypeFeatureEnabled)) && (
            <div style={styles.costType}>
              <CostType costType={costType} onSelect={onCostTypeSelected} />
            </div>
          )}
        </div>
        <ExplorerFilter
          groupBy={groupBy}
          isDisabled={noProviders}
          onFilterAdded={onFilterAdded}
          onFilterRemoved={onFilterRemoved}
          perspective={perspective}
          query={query}
          resourcePathsType={resourcePathsType}
        />
      </header>
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mapStateToProps = createMapStateToProps<ExplorerHeaderOwnProps, ExplorerHeaderStateProps>(
  (state, { perspective, router }) => {
    const queryFromRoute = parseQuery<Query>(router.location.search);
    const dateRangeType = getDateRangeTypeDefault(queryFromRoute);
    const { end_date, start_date } = getDateRangeFromQuery(queryFromRoute);

    const providersQueryString = getProvidersQuery(providersQuery);
    const providers = providersSelectors.selectProviders(state, ProviderType.all, providersQueryString);
    const providersError = providersSelectors.selectProvidersError(state, ProviderType.all, providersQueryString);
    const providersFetchStatus = providersSelectors.selectProvidersFetchStatus(
      state,
      ProviderType.all,
      providersQueryString
    );

    const userAccessQueryString = getUserAccessQuery(userAccessQuery);
    const userAccess = userAccessSelectors.selectUserAccess(state, UserAccessType.all, userAccessQueryString);
    const userAccessError = userAccessSelectors.selectUserAccessError(state, UserAccessType.all, userAccessQueryString);
    const userAccessFetchStatus = userAccessSelectors.selectUserAccessFetchStatus(
      state,
      UserAccessType.all,
      userAccessQueryString
    );

    // Ensure group_by key is not undefined
    let groupBy = queryFromRoute.group_by;
    if (!groupBy && perspective) {
      groupBy = { [getGroupByDefault(perspective)]: '*' };
    }

    const query = {
      filter: {
        ...baseQuery.filter,
        ...queryFromRoute.filter,
      },
      exclude: queryFromRoute.exclude || baseQuery.exclude,
      filter_by: queryFromRoute.filter_by || baseQuery.filter_by,
      group_by: groupBy,
      order_by: queryFromRoute.order_by,
      perspective,
      dateRangeType,
      ...(dateRangeType === DateRangeType.custom && {
        end_date,
        start_date,
      }),
    };

    return {
      awsProviders: filterProviders(providers, ProviderType.aws),
      azureProviders: filterProviders(providers, ProviderType.azure),
      gcpProviders: filterProviders(providers, ProviderType.gcp),
      ibmProviders: filterProviders(providers, ProviderType.ibm),
      isCostTypeFeatureEnabled: featureFlagsSelectors.selectIsCostTypeFeatureEnabled(state),
      isCurrencyFeatureEnabled: featureFlagsSelectors.selectIsCurrencyFeatureEnabled(state),
      isExportsFeatureEnabled: featureFlagsSelectors.selectIsExportsFeatureEnabled(state),
      isFINsightsFeatureEnabled: featureFlagsSelectors.selectIsFINsightsFeatureEnabled(state),
      isIbmFeatureEnabled: featureFlagsSelectors.selectIsIbmFeatureEnabled(state),
      isOciFeatureEnabled: featureFlagsSelectors.selectIsOciFeatureEnabled(state),
      ociProviders: filterProviders(providers, ProviderType.oci),
      ocpProviders: filterProviders(providers, ProviderType.ocp),
      providers,
      providersError,
      providersFetchStatus,
      providersQueryString,
      query,
      rhelProviders: filterProviders(providers, ProviderType.rhel),
      userAccess,
      userAccessError,
      userAccessFetchStatus,
      userAccessQueryString,
    };
  }
);

const ExplorerHeader = injectIntl(withRouter(connect(mapStateToProps, {})(ExplorerHeaderBase)));

export { ExplorerHeader };
export type { ExplorerHeaderProps };
