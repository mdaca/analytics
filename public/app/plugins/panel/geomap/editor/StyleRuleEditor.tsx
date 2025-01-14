import React, { FC, useCallback, useMemo } from 'react';
import { GrafanaTheme2, SelectableValue, StandardEditorProps } from '@grafana/data';
import { ComparisonOperation, FeatureStyleConfig } from '../types';
import { Button, InlineField, InlineFieldRow, Select, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { StyleEditor } from '../layers/data/StyleEditor';
import { defaultStyleConfig, StyleConfig } from '../style/types';
import { DEFAULT_STYLE_RULE } from '../layers/data/geojsonLayer';
import { Observable } from 'rxjs';
import { useObservable } from 'react-use';
import { getUniqueFeatureValues, LayerContentInfo } from '../utils/getFeatures';
import { FeatureLike } from 'ol/Feature';
import { getSelectionInfo } from '../utils/selection';
import { NumberInput } from 'app/features/dimensions/editors/NumberInput';
import { isNumber } from 'lodash';

export interface StyleRuleEditorSettings {
  features: Observable<FeatureLike[]>;
  layerInfo: Observable<LayerContentInfo>;
}

const comparators = [
  { label: '==', value: ComparisonOperation.EQ },
  { label: '>', value: ComparisonOperation.GT },
  { label: '>=', value: ComparisonOperation.GTE },
  { label: '<', value: ComparisonOperation.LT },
  { label: '<=', value: ComparisonOperation.LTE },
];

export const StyleRuleEditor: FC<StandardEditorProps<FeatureStyleConfig, any, any, StyleRuleEditorSettings>> = (
  props
) => {
  const { value, onChange, item, context } = props;
  const settings: StyleRuleEditorSettings = item.settings;
  const { features, layerInfo } = settings;

  const propertyOptions = useObservable(layerInfo);
  const feats = useObservable(features);

  const uniqueSelectables = useMemo(() => {
    const key = value?.check?.property;
    if (key && feats && value.check?.operation === ComparisonOperation.EQ) {
      return getUniqueFeatureValues(feats, key).map((v) => ({ value: v, label: v }));
    }
    return [];
  }, [feats, value]);

  const styles = useStyles2(getStyles);

  const LABEL_WIDTH = 10;

  const onChangeProperty = useCallback(
    (selection?: SelectableValue) => {
      onChange({
        ...value,
        check: {
          ...value.check!,
          property: selection?.value,
        },
      });
    },
    [onChange, value]
  );

  const onChangeComparison = useCallback(
    (selection: SelectableValue) => {
      onChange({
        ...value,
        check: {
          ...value.check!,
          operation: selection.value ?? ComparisonOperation.EQ,
        },
      });
    },
    [onChange, value]
  );

  const onChangeValue = useCallback(
    (selection?: SelectableValue) => {
      onChange({
        ...value,
        check: {
          ...value.check!,
          value: selection?.value,
        },
      });
    },
    [onChange, value]
  );

  const onChangeNumericValue = useCallback(
    (v?: number) => {
      onChange({
        ...value,
        check: {
          ...value.check!,
          value: v!,
        },
      });
    },
    [onChange, value]
  );

  const onChangeStyle = useCallback(
    (style?: StyleConfig) => {
      onChange({ ...value, style });
    },
    [onChange, value]
  );

  const onDelete = useCallback(() => {
    onChange(undefined);
  }, [onChange]);

  const check = value.check ?? DEFAULT_STYLE_RULE.check!;
  const propv = getSelectionInfo(check.property, propertyOptions?.propertes);
  const valuev = getSelectionInfo(check.value, uniqueSelectables);

  return (
    <div className={styles.rule}>
      <InlineFieldRow className={styles.row}>
        <InlineField label="Rule" labelWidth={LABEL_WIDTH} grow={true}>
          <Select
            menuShouldPortal
            placeholder={'Feature property'}
            value={propv.current}
            options={propv.options}
            onChange={onChangeProperty}
            aria-label={'Feature property'}
            isClearable
            allowCustomValue
          />
        </InlineField>
        <InlineField className={styles.inline}>
          <Select
            menuShouldPortal
            value={comparators.find((v) => v.value === check.operation)}
            options={comparators}
            onChange={onChangeComparison}
            aria-label={'Comparison operator'}
            width={6}
          />
        </InlineField>
        <InlineField className={styles.inline} grow={true}>
          <>
            {check.operation === ComparisonOperation.EQ && (
              <Select
                menuShouldPortal
                placeholder={'value'}
                value={valuev.current}
                options={valuev.options}
                onChange={onChangeValue}
                aria-label={'Comparison value'}
                isClearable
                allowCustomValue
              />
            )}
            {check.operation !== ComparisonOperation.EQ && (
              <NumberInput
                key={`${check.property}/${check.operation}`}
                value={isNumber(check.value) ? check.value : 0}
                placeholder="numeric value"
                onChange={onChangeNumericValue}
              />
            )}
          </>
        </InlineField>
        <Button
          size="md"
          icon="trash-alt"
          onClick={() => onDelete()}
          variant="secondary"
          aria-label={'Delete style rule'}
          className={styles.button}
        ></Button>
      </InlineFieldRow>
      <div>
        <StyleEditor
          value={value.style ?? defaultStyleConfig}
          context={context}
          onChange={onChangeStyle}
          item={
            {
              settings: {
                simpleFixedValues: true,
              },
            } as any
          }
        />
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  rule: css`
    margin-bottom: ${theme.spacing(1)};
  `,
  row: css`
    display: flex;
    margin-bottom: 4px;
  `,
  inline: css`
    margin-bottom: 0;
    margin-left: 4px;
  `,
  button: css`
    margin-left: 4px;
  `,
});
