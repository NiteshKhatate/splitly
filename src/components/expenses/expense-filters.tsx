import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { EXPENSE_CATEGORIES, type ExpenseFilters } from "@/lib/validations/expenses";

export function ExpenseFiltersForm({
  filters,
  groupId,
  members,
}: {
  filters: ExpenseFilters;
  groupId: string;
  members: { id: string; name: string }[];
}) {
  return (
    <form action={`/groups/${groupId}/expenses`} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <TextField id="expense-search" label="Search" name="search" defaultValue={filters.search} placeholder="Description" />
      <TextField id="expense-from" label="From" name="from" type="date" defaultValue={filters.from} />
      <TextField id="expense-to" label="To" name="to" type="date" defaultValue={filters.to} />
      <SelectField id="expense-member" label="Member" name="memberId" defaultValue={filters.memberId ?? ""}>
        <option value="">All members</option>
        {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
      </SelectField>
      <SelectField id="expense-filter-category" label="Category" name="category" defaultValue={filters.category ?? ""}>
        <option value="">All categories</option>
        {EXPENSE_CATEGORIES.map((category) => (
          <option key={category} value={category}>{category.charAt(0) + category.slice(1).toLowerCase()}</option>
        ))}
      </SelectField>
      <div className="flex gap-3 sm:col-span-2 lg:col-span-5 lg:justify-end">
        <Button href={`/groups/${groupId}/expenses`} variant="secondary">Clear</Button>
        <Button type="submit">Apply filters</Button>
      </div>
    </form>
  );
}
