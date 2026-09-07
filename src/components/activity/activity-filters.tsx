import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import {
  ACTIVITY_TYPE_OPTIONS,
  type ActivityGroupOption,
} from "@/lib/activity/list-activity";

export function ActivityFilters({
  groupId,
  groups,
  type,
}: {
  groupId?: string;
  groups: ActivityGroupOption[];
  type?: string;
}) {
  const hasFilters = Boolean(groupId || type);

  return (
    <form action="/activity" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end" method="get">
      <SelectField defaultValue={groupId ?? ""} id="activity-group" label="Group" name="groupId">
        <option value="">All groups</option>
        {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
      </SelectField>
      <SelectField defaultValue={type ?? ""} id="activity-type" label="Activity type" name="type">
        <option value="">All activity</option>
        {ACTIVITY_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </SelectField>
      <div className="grid gap-3 sm:col-span-2 sm:flex sm:flex-wrap lg:col-span-1">
        <Button className="w-full sm:w-auto" type="submit">Apply filters</Button>
        {hasFilters ? <Button className="w-full sm:w-auto" href="/activity" variant="secondary">Clear</Button> : null}
      </div>
    </form>
  );
}
