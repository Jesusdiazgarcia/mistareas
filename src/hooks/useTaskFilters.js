import { useMemo, useState } from 'react';
import { filterTasks } from '../utils/taskModel';

export function useTaskFilters(tasks) {
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [sort, setSort] = useState('default');

    const filteredTasks = useMemo(
        () => filterTasks(tasks, { filter, search, filterCategory, filterPriority, sort }),
        [tasks, filter, search, filterCategory, filterPriority, sort]
    );

    return {
        filteredTasks,
        filter, setFilter,
        search, setSearch,
        filterCategory, setFilterCategory,
        filterPriority, setFilterPriority,
        sort, setSort
    };
}
