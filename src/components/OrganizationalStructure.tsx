import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Building, Search } from 'lucide-react';
import { employees, organizationalLeaders, companies, programs } from '@/data/organizationalStructure';

export const OrganizationalStructure = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLeader, setFilterLeader] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeader = filterLeader === 'all' || employee.organizationalLeader === filterLeader;
    const matchesCompany = filterCompany === 'all' || employee.company === filterCompany;
    const matchesProgram = filterProgram === 'all' || employee.program === filterProgram;
    
    return matchesSearch && matchesLeader && matchesCompany && matchesProgram;
  });

  const getLeaderBadgeColor = (leader: string) => {
    const colors: { [key: string]: string } = {
      'JoMa': 'bg-blue-500',
      'OnLi': 'bg-green-500',
      'KaSo': 'bg-purple-500',
      'PaHo': 'bg-orange-500',
      'PeMa': 'bg-red-500',
      'DaAm': 'bg-yellow-500',
      'PeNe': 'bg-pink-500',
      'Dodavatel': 'bg-gray-500'
    };
    return colors[leader] || 'bg-gray-500';
  };

  const getCompanyBadge = (company: string) => {
    if (company === 'TM CZ a.s.') {
      return <Badge variant="default" className="bg-primary text-primary-foreground">TM CZ</Badge>;
    }
    return <Badge variant="outline" className="border-accent text-accent-foreground">MB idea SK</Badge>;
  };

  const getProgramBadge = (program: string) => {
    if (program === 'N/A' || !program) {
      return <Badge variant="secondary">N/A</Badge>;
    }
    
    const shortPrograms: { [key: string]: string } = {
      'Steam Turbines': 'ST',
      'Car Body & Bogies': 'CBB',
      'Electro Design': 'ED',
      'Interiors & Non-metallic Design': 'IND',
      'General Machinery': 'GM',
      'Stress Analysis': 'SA',
      'IWE': 'IWE'
    };
    
    return <Badge variant="outline">{shortPrograms[program] || program}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-card-custom">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Organizační struktura</h2>
            <Badge variant="outline">{filteredEmployees.length} z {employees.length} zaměstnanců</Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Hledat zaměstnance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={filterLeader} onValueChange={setFilterLeader}>
            <SelectTrigger>
              <SelectValue placeholder="Všichni vedoucí" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všichni vedoucí</SelectItem>
              {organizationalLeaders.map(leader => (
                <SelectItem key={leader} value={leader}>{leader}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCompany} onValueChange={setFilterCompany}>
            <SelectTrigger>
              <SelectValue placeholder="Všechny společnosti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny společnosti</SelectItem>
              {companies.map(company => (
                <SelectItem key={company} value={company}>{company}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterProgram} onValueChange={setFilterProgram}>
            <SelectTrigger>
              <SelectValue placeholder="Všechny programy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny programy</SelectItem>
              {programs.map(program => (
                <SelectItem key={program} value={program}>{program}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jméno</TableHead>
                <TableHead>Společnost</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Organizační vedoucí</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee, index) => (
                <TableRow key={employee.id} className={index % 2 === 1 ? 'bg-muted/30' : 'bg-background'}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{getCompanyBadge(employee.company)}</TableCell>
                  <TableCell>{getProgramBadge(employee.program)}</TableCell>
                  <TableCell>
                    <Badge 
                      className={`${getLeaderBadgeColor(employee.organizationalLeader)} text-white border-none`}
                    >
                      {employee.organizationalLeader}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEmployees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Žádní zaměstnanci nevyhovují zadaným filtrům
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">TM CZ a.s.</p>
                <p className="text-xl font-bold text-primary">
                  {employees.filter(e => e.company === 'TM CZ a.s.').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">MB idea SK</p>
                <p className="text-xl font-bold text-accent">
                  {employees.filter(e => e.company === 'MB idea SK, s.r.o.').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Vedoucí</p>
                <p className="text-xl font-bold text-secondary">
                  {organizationalLeaders.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Programy</p>
                <p className="text-xl font-bold text-muted-foreground">
                  {programs.filter(p => p !== 'N/A').length}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
};