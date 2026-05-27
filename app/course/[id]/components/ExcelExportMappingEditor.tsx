'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import {
  DEFAULT_EXCEL_EXPORT_MAPPING,
  EXCEL_EXPORT_FIELD_OPTIONS,
  type ExcelExportMapping,
  type ExcelExportRangeMapping,
  type ExcelExportSingleCellMapping,
} from '../lib/excelExportMapping';

interface ExcelExportMappingEditorProps {
  courseId: string;
  onSaved?: () => void;
}

const newSingleCell = (): ExcelExportSingleCellMapping => ({ field: 'course.code', cell: 'H2' });
const newRangeMapping = (): ExcelExportRangeMapping => ({ field: 'student.name', from: 'V10', to: 'V51' });

export default function ExcelExportMappingEditor({ courseId, onSaved }: ExcelExportMappingEditorProps) {
  const [sheetName, setSheetName] = useState('GradeSheet');
  const [singleCells, setSingleCells] = useState<ExcelExportSingleCellMapping[]>([]);
  const [rangeMappings, setRangeMappings] = useState<ExcelExportRangeMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/courses/${courseId}/excel-export-mapping`);
        const data = await response.json();

        if (response.ok) {
          const mapping: ExcelExportMapping = data.mapping || DEFAULT_EXCEL_EXPORT_MAPPING;
          setSheetName(mapping.sheetName || 'GradeSheet');
          setSingleCells(mapping.singleCells?.length ? mapping.singleCells : DEFAULT_EXCEL_EXPORT_MAPPING.singleCells || []);
          setRangeMappings(mapping.rangeMappings?.length ? mapping.rangeMappings : DEFAULT_EXCEL_EXPORT_MAPPING.rangeMappings || []);
        } else {
          setError(data.error || 'Failed to load mapping');
          setSheetName(DEFAULT_EXCEL_EXPORT_MAPPING.sheetName || 'GradeSheet');
          setSingleCells(DEFAULT_EXCEL_EXPORT_MAPPING.singleCells || []);
          setRangeMappings(DEFAULT_EXCEL_EXPORT_MAPPING.rangeMappings || []);
        }
      } catch (err) {
        setError('Failed to load mapping');
        setSheetName(DEFAULT_EXCEL_EXPORT_MAPPING.sheetName || 'GradeSheet');
        setSingleCells(DEFAULT_EXCEL_EXPORT_MAPPING.singleCells || []);
        setRangeMappings(DEFAULT_EXCEL_EXPORT_MAPPING.rangeMappings || []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [courseId]);

  const save = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const mapping: ExcelExportMapping = {
        sheetName: sheetName || 'GradeSheet',
        singleCells: singleCells.filter((item) => item.field && item.cell),
        rangeMappings: rangeMappings.filter((item) => item.field && item.from && item.to),
      };

      const response = await fetch(`/api/courses/${courseId}/excel-export-mapping`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapping }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Mapping saved successfully');
        onSaved?.();
      } else {
        setError(data.error || 'Failed to save mapping');
      }
    } catch (err) {
      setError('Failed to save mapping');
    } finally {
      setSaving(false);
    }
  };

  const updateSingleCell = (index: number, patch: Partial<ExcelExportSingleCellMapping>) => {
    setSingleCells((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  const updateRangeMapping = (index: number, patch: Partial<ExcelExportRangeMapping>) => {
    setRangeMappings((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading export mapping...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Excel Sheet</CardTitle>
          <CardDescription>Choose the sheet that will be edited inside the workbook.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="sheetName">Sheet Name</Label>
            <Input id="sheetName" value={sheetName} onChange={(e) => setSheetName(e.target.value)} placeholder="GradeSheet" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Single Cell Mappings</CardTitle>
            <CardDescription>Map one MMS field to one Excel cell, for example H2 or L3.</CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={() => setSingleCells((current) => [...current, newSingleCell()])}>
            <Plus className="mr-2 h-4 w-4" />
            Add Single Cell
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {singleCells.length === 0 && <p className="text-sm text-muted-foreground">No single cell mappings yet.</p>}
          {singleCells.map((item, index) => (
            <div key={`${item.cell}-${index}`} className="grid gap-3 md:grid-cols-[1.5fr_1fr_auto] items-end rounded-lg border p-4">
              <div className="space-y-2">
                <Label>MMS Field</Label>
                <select value={item.field} onChange={(e) => updateSingleCell(index, { field: e.target.value as ExcelExportSingleCellMapping['field'] })} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  {EXCEL_EXPORT_FIELD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Excel Cell</Label>
                <Input value={item.cell} onChange={(e) => updateSingleCell(index, { cell: e.target.value.toUpperCase() })} placeholder="H2" />
              </div>
              <Button type="button" variant="destructive" onClick={() => setSingleCells((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Range Mappings</CardTitle>
            <CardDescription>Map a repeating MMS field to an Excel cell range, for example V10 to V51.</CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={() => setRangeMappings((current) => [...current, newRangeMapping()])}>
            <Plus className="mr-2 h-4 w-4" />
            Add Range
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {rangeMappings.length === 0 && <p className="text-sm text-muted-foreground">No range mappings yet.</p>}
          {rangeMappings.map((item, index) => (
            <div key={`${item.from}-${index}`} className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_auto] items-end rounded-lg border p-4">
              <div className="space-y-2">
                <Label>MMS Field</Label>
                <select value={item.field} onChange={(e) => updateRangeMapping(index, { field: e.target.value as ExcelExportRangeMapping['field'] })} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  {EXCEL_EXPORT_FIELD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>From Cell</Label>
                <Input value={item.from} onChange={(e) => updateRangeMapping(index, { from: e.target.value.toUpperCase() })} placeholder="V10" />
              </div>
              <div className="space-y-2">
                <Label>To Cell</Label>
                <Input value={item.to} onChange={(e) => updateRangeMapping(index, { to: e.target.value.toUpperCase() })} placeholder="V51" />
              </div>
              <Button type="button" variant="destructive" onClick={() => setRangeMappings((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => {
          setSheetName(DEFAULT_EXCEL_EXPORT_MAPPING.sheetName || 'GradeSheet');
          setSingleCells(DEFAULT_EXCEL_EXPORT_MAPPING.singleCells || []);
          setRangeMappings(DEFAULT_EXCEL_EXPORT_MAPPING.rangeMappings || []);
          setError('');
          setSuccess('');
        }} disabled={saving}>
          Reset Defaults
        </Button>
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Mapping
        </Button>
      </div>
    </div>
  );
}
