import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";

export function ExpenseExportForm({ groups }: { groups: { id: string; name: string }[] }) {
  return (
    <form action="/exports/expenses.csv" className="grid gap-4 sm:grid-cols-2" method="get">
      <div className="sm:col-span-2">
        <SelectField id="export-group" label="Group" name="groupId" required>
          <option value="">Choose a group</option>
          {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
        </SelectField>
      </div>
      <TextField id="export-from" label="From" name="from" type="date" />
      <TextField id="export-to" label="To" name="to" type="date" />
      <div className="sm:col-span-2">
        <Button className="w-full sm:w-auto" disabled={groups.length === 0} type="submit">Download CSV</Button>
      </div>
    </form>
  );
}
