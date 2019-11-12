import { css } from '@patternfly/react-styles';
import { AzureReport, AzureReportType } from 'api/azureReports';
import { EmptyValueState } from 'components/state/emptyValueState/emptyValueState';
import React from 'react';
import { InjectedTranslateProps, translate } from 'react-i18next';
import { FormatOptions, ValueFormatter } from 'utils/formatValue';
import { unitLookupKey } from 'utils/formatValue';
import { styles } from './azureReportSummaryDetails.styles';

interface AzureReportSummaryDetailsProps extends InjectedTranslateProps {
  costLabel?: string;
  report: AzureReport;
  reportType: AzureReportType;
  formatValue?: ValueFormatter;
  formatOptions?: FormatOptions;
  showUnits?: boolean;
<<<<<<< HEAD
  usageFormatOptions?: FormatOptions;
=======
  units?: string;
>>>>>>> Fixes for #1079, These fixes are for Azure and are a working for Issue-1360
  usageLabel?: string;
}

const AzureReportSummaryDetailsBase: React.SFC<
  AzureReportSummaryDetailsProps
> = ({
  costLabel,
  formatValue,
  formatOptions,
  report,
  reportType = AzureReportType.cost,
  showUnits = false,
  t,
<<<<<<< HEAD
  usageFormatOptions,
=======
  units,
>>>>>>> Fixes for #1079, These fixes are for Azure and are a working for Issue-1360
  usageLabel,
}) => {
  let cost: string | React.ReactNode = <EmptyValueState />;
  let usage: string | React.ReactNode = <EmptyValueState />;

  if (report && report.meta && report.meta.total) {
    cost = formatValue(
      report.meta.total.cost ? report.meta.total.cost.value : 0,
      report.meta.total.cost ? report.meta.total.cost.units : 'USD',
      formatOptions
    );
    if (report.meta.total.usage && report.meta.total.usage.value) {
      usage = formatValue(
        report.meta.total.usage ? report.meta.total.usage.value : 0,
        report.meta.total.usage ? report.meta.total.usage.units : '',
        usageFormatOptions ? usageFormatOptions : formatOptions
      );
    } else {
      // Work around for https://github.com/project-koku/koku-ui/issues/1058
      usage = formatValue(
        report.meta.total.usage ? (report.meta.total.usage as any) : 0,
        report.meta.total.count ? report.meta.total.count.units : '',
        usageFormatOptions ? usageFormatOptions : formatOptions
      );
    }
  }

  if (reportType === AzureReportType.cost) {
    return (
      <div className={css(styles.reportSummaryDetails)}>
        <div className={css(styles.value)}>{cost}</div>
      </div>
    );
  } else {
    const usageUnits: string =
      report && report.meta && report.meta.total && report.meta.total.usage
        ? report.meta.total.usage.units
        : '';
    // added as a work-around for azure #1079
    const _units = unitLookupKey(units ? units : usageUnits);
    const unitsLabel = t(`units.${_units}`);

    return (
      <>
        <div className={css(styles.valueContainer)}>
          <div className={css(styles.value)}>{cost}</div>
          <div className={css(styles.text)}>
            <div>{costLabel}</div>
          </div>
        </div>
        {Boolean(usageLabel) && (
          <div className={css(styles.valueContainer)}>
            <div className={css(styles.value)}>
              {usage}
              {Boolean(showUnits && usage >= 0) && (
                <span className={css(styles.text)}>{unitsLabel}</span>
              )}
            </div>
            <div className={css(styles.text)}>
              <div>{usageLabel}</div>
            </div>
          </div>
        )}
      </>
    );
  }
};

const AzureReportSummaryDetails = translate()(AzureReportSummaryDetailsBase);

export { AzureReportSummaryDetails, AzureReportSummaryDetailsProps };
