import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '@/lib/api-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ArrowRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  mentor_count: number;
  description: string;
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await ApiService.getCategories();
        if (response.data) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/find-mentor?category=${categoryId}`);
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Browse Mentors by Category</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Find the perfect mentor in your area of interest
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="h-64">
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card 
              key={category.id} 
              className="h-64 cursor-pointer hover:shadow-lg transition-shadow duration-300"
              onClick={() => handleCategoryClick(category.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{category.name}</span>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </CardTitle>
                <CardDescription>
                  {category.mentor_count} {category.mentor_count === 1 ? 'mentor' : 'mentors'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col justify-between h-[calc(100%-88px)]">
                <p className="text-muted-foreground">{category.description}</p>
                <Button 
                  variant="ghost" 
                  className="w-full mt-4 flex items-center justify-between"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCategoryClick(category.id);
                  }}
                >
                  <span>Browse mentors</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Categories;