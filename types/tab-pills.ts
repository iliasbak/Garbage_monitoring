interface TabPillsProps {
    tabs: {
        label: string,
        value: string
    }[],
    selectedTabValue: string,
    onTabChange: (value: string) => void
}