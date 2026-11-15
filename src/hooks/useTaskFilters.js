import { useState } from 'react';
import { sortTaskArray } from '../utils/helpers';

export function useTaskFilters({ tasks }) {
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [sort, setSort] = useState('default');

    const filteredTasks = (() => {
        let filtered = tasks;
        if (filter === 'pending') filtered = filtered.filter(t => !t.completed && !t.inProgress);
        else if (filter === 'inprogress') filtered = filtered.filter(t => !t.completed && t.inProgress);
        else if (filter === 'completed') filtered = filtered.filter(t => t.completed);
        else if (filter === 'recurring') filtered = filtered.filter(t => t.repeat && t.repeat !== 'none');

        if (search.trim()) filtered = filtered.filter(t => t.text.toLowerCase().includes(search.toLowerCase().trim()));
        if (filterCategory !== 'all') filtered = filtered.filter(t => (t.category || 'none') === filterCategory);
        if (filterPriority !== 'all') filtered = filtered.filter(t => (t.priority || 'none') === filterPriority);

        return sortTaskArray(filtered, sort);
    })();

    return { filter, setFilter, search, setSearch, filterCategory, setFilterCategory, filterPriority, setFilterPriority, sort, setSort, filteredTasks };
}
